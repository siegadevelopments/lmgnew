// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const CLICKSEND_USERNAME = Deno.env.get('CLICKSEND_USERNAME')
const CLICKSEND_API_KEY = Deno.env.get('CLICKSEND_API_KEY')

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const { booking, customer_email, customer_phone, product_id, vendor_id, product_title, vendor_name, payment_method } = await req.json()

    console.log(`Creating booking for user ${user.id}, product ${product_id}, payment ${payment_method}`)

    // 1. Create Booking
    const { data: bookingData, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert({
        customer_id: user.id,
        product_id: typeof product_id === 'string' ? parseInt(product_id) : product_id,
        vendor_id,
        start_time: booking.start_time,
        end_time: booking.end_time,
        status: payment_method === 'store' ? 'pending' : 'confirmed',
      } as any)
      .select()
      .single()

    if (bookingError) {
      console.error('Booking Error:', bookingError)
      throw bookingError
    }

    // 2. Send Email
    if (RESEND_API_KEY) {
      try {
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'Lifestyle Medicine Gateway <orders@lifestylemedicinegateway.com>',
            to: [customer_email],
            subject: `Booking Confirmation: ${product_title}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; rounded: 10px;">
                <h1 style="color: #10b981;">Booking Confirmed!</h1>
                <p>Hi,</p>
                <p>Your appointment for <strong>${product_title}</strong> with <strong>${vendor_name}</strong> has been successfully scheduled.</p>
                <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(booking.start_time).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date(booking.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                  <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${payment_method === 'store' ? 'Pay on Store' : 'Paid Online'}</p>
                </div>
                <p>If you need to reschedule or cancel, please visit your profile on our website.</p>
                <p>Best regards,<br>The LMG Team</p>
              </div>
            `,
          }),
        })
        if (!emailRes.ok) console.error('Failed to send email:', await emailRes.text())
      } catch (e) {
        console.error('Email fetch error:', e)
      }
    }

    // 3. Send SMS via ClickSend
    if (CLICKSEND_USERNAME && CLICKSEND_API_KEY && customer_phone) {
      try {
        const auth = btoa(`${CLICKSEND_USERNAME}:${CLICKSEND_API_KEY}`)
        const formattedDate = new Date(booking.start_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        const smsRes = await fetch('https://rest.clicksend.com/v3/sms/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${auth}`,
          },
          body: JSON.stringify({
            messages: [
              {
                body: `LMG: Booking confirmed for ${product_title} on ${formattedDate}. Payment: ${payment_method === 'store' ? 'Pay on Store' : 'Paid'}.`,
                to: customer_phone
              }
            ]
          }),
        })
        if (!smsRes.ok) console.error('Failed to send SMS:', await smsRes.text())
      } catch (e) {
        console.error('SMS fetch error:', e)
      }
    }

    return new Response(JSON.stringify({ success: true, booking: bookingData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
