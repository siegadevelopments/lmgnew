import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  httpClient: Stripe.createFetchHttpClient(),
})
const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

serve(async (req) => {
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

      // 3. Trigger Email Notification (Invoke send-email function)
      // This part depends on how you want to handle it. 
      // You could call the internal Edge Function or just send directly via fetch here.
      console.log(`Order ${orderId} completed and paid.`)
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
