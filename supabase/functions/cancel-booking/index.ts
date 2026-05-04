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

    const { booking_id, customer_email, customer_phone, product_title, start_time } = await req.json()

    console.log(`Cancelling booking ${booking_id} for user ${user.id}`)

    // 1. Update Booking Status
    const { error: bookingError } = await supabaseAdmin
      .from('bookings')
      .update({ status: 'cancelled' } as any)
      .eq('id', booking_id)
      .eq('customer_id', user.id)

    if (bookingError) {
      console.error('Booking Cancel Error:', bookingError)
      throw bookingError
    }

    const formattedDate = new Date(start_time).toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })

    // 2. Send Email
    if (RESEND_API_KEY) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'Lifestyle Medicine Gateway <orders@lifestylemedicinegateway.com>',
            to: [customer_email],
            subject: `Booking Cancelled: ${product_title}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h1 style="color: #ef4444;">Booking Cancelled</h1>
                <p>Hi,</p>
                <p>Your appointment for <strong>${product_title}</strong> on <strong>${formattedDate}</strong> has been cancelled.</p>
                <p>If this was a mistake or you'd like to reschedule, please visit our website.</p>
                <p>Best regards,<br>The LMG Team</p>
              </div>
            `,
          }),
        })
      } catch (e) {
        console.error('Email cancel notification error:', e)
      }
    }

    // 3. Send SMS via ClickSend
    if (CLICKSEND_USERNAME && CLICKSEND_API_KEY && customer_phone) {
      try {
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
                body: `LMG: Your booking for ${product_title} on ${formattedDate} has been cancelled.`,
                to: customer_phone
              }
            ]
          }),
        })
      } catch (e) {
        console.error('SMS cancel notification error:', e)
      }
    }

    return new Response(JSON.stringify({ success: true }), {
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
