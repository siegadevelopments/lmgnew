// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
// @ts-ignore
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  httpClient: Stripe.createFetchHttpClient(),
})
const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const CLICKSEND_USERNAME = Deno.env.get('CLICKSEND_USERNAME')
const CLICKSEND_API_KEY = Deno.env.get('CLICKSEND_API_KEY')

serve(async (req: Request) => {
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  try {
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(body, signature, endpointSecret!)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const orderId = session.metadata?.order_id
      const userId = session.metadata?.user_id

      // 1. Update Order Status
      await supabaseAdmin
        .from('orders')
        .update({ payment_status: 'paid', status: 'confirmed' } as any)
        .eq('id', orderId)

      // 2. Fetch line items with metadata to create bookings
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ['data.price.product'],
      })

      for (const item of lineItems.data) {
        const product = item.price?.product as Stripe.Product
        const bookingStart = product.metadata?.booking_start
        const bookingEnd = product.metadata?.booking_end

        if (bookingStart && bookingEnd) {
          // Create booking
          await supabaseAdmin.from('bookings').insert({
            order_id: orderId,
            product_id: parseInt(product.metadata.product_id),
            customer_id: userId,
            vendor_id: product.metadata.vendor_id, // We need vendor_id in metadata too
            start_time: bookingStart,
            end_time: bookingEnd,
            status: 'confirmed',
          } as any)
        }
      }

      // 3. Trigger Email & SMS Notifications for Bookings
      const { data: order } = await supabaseAdmin.from('orders').select('*').eq('id', orderId).single()
      
      for (const item of lineItems.data) {
        const product = item.price?.product as Stripe.Product
        const bookingStart = product.metadata?.booking_start
        
        if (bookingStart && order) {
          const productTitle = product.name
          const customerEmail = order.email
          const customerPhone = order.phone
          const formattedDate = new Date(bookingStart).toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })

          // Send Email
          if (RESEND_API_KEY) {
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
              },
              body: JSON.stringify({
                from: 'Lifestyle Medicine Gateway <orders@lifestylemedicinegateway.com>',
                to: [customerEmail],
                subject: `Booking Confirmed: ${productTitle}`,
                html: `
                  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h1 style="color: #10b981;">Booking Confirmed!</h1>
                    <p>Hi,</p>
                    <p>Your appointment for <strong>${productTitle}</strong> has been successfully scheduled and paid online.</p>
                    <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                      <p style="margin: 5px 0;"><strong>Date/Time:</strong> ${formattedDate}</p>
                      <p style="margin: 5px 0;"><strong>Payment Status:</strong> Paid Online</p>
                    </div>
                    <p>Thank you for your purchase!</p>
                  </div>
                `,
              }),
            })
          }

          // Send SMS
          if (CLICKSEND_USERNAME && CLICKSEND_API_KEY && customerPhone) {
            const auth = btoa(`${CLICKSEND_USERNAME}:${CLICKSEND_API_KEY}`)
            await fetch('https://rest.clicksend.com/v3/sms/send', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`,
              },
              body: JSON.stringify({
                messages: [
                  {
                    body: `LMG: Your booking for ${productTitle} on ${formattedDate} is confirmed and paid. Thank you!`,
                    to: customerPhone
                  }
                ]
              }),
            })
          }
        }
      }

      console.log(`Order ${orderId} completed and paid. Notifications sent.`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err: any) {
    console.error(`Error: ${err.message}`)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }
})
