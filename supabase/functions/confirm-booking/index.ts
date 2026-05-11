// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const CLICKSEND_USERNAME = Deno.env.get("CLICKSEND_USERNAME");
const CLICKSEND_API_KEY = Deno.env.get("CLICKSEND_API_KEY");
const ADMIN_EMAIL = "info@lifestylemedicinegateway.com";
const FROM_EMAIL = "Lifestyle Medicine Gateway <orders@lifestylemedicinegateway.com>";

/** Sends a single email via Resend. Silently logs errors so one failure doesn't break others. */
async function sendEmail(to: string[], subject: string, html: string) {
  if (!RESEND_API_KEY) return;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });
    if (!res.ok) console.error(`Failed to send email to ${to.join(", ")}:`, await res.text());
    else console.log(`Email sent to ${to.join(", ")}`);
  } catch (e) {
    console.error("Email fetch error:", e);
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } },
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseUser.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const {
      booking,
      customer_email,
      customer_phone,
      product_id,
      vendor_id,
      product_title,
      vendor_name,
      payment_method,
    } = await req.json();

    console.log(
      `Creating booking for user ${user.id}, product ${product_id}, payment ${payment_method}`,
    );

    // 1. Create Booking
    const { data: bookingData, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .insert({
        customer_id: user.id,
        product_id: typeof product_id === "string" ? parseInt(product_id) : product_id,
        vendor_id,
        start_time: booking.start_time,
        end_time: booking.end_time,
        status: payment_method === "store" ? "pending" : "confirmed",
      } as any)
      .select()
      .single();

    if (bookingError) {
      console.error("Booking Error:", bookingError);
      throw bookingError;
    }

    // 2. Look up vendor's auth email so we can notify them
    let vendorEmail: string | null = null;
    try {
      const { data: vendorAuthUser } = await supabaseAdmin.auth.admin.getUserById(vendor_id);
      vendorEmail = vendorAuthUser?.user?.email ?? null;
      console.log("Vendor email:", vendorEmail);
    } catch (e) {
      console.error("Could not fetch vendor email:", e);
    }

    // Shared booking detail block used in all emails
    const bookingDate = new Date(booking.start_time).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const bookingTime = new Date(booking.start_time).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const bookingEndTime = new Date(booking.end_time).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const paymentLabel = payment_method === "store" ? "Pay on Store / Clinic" : "Paid Online via Stripe";

    const detailsBlock = `
      <div style="background:#f9fafb;padding:16px 20px;border-radius:10px;margin:20px 0;border:1px solid #e5e7eb;">
        <p style="margin:6px 0"><strong>Service:</strong> ${product_title}</p>
        <p style="margin:6px 0"><strong>Provider:</strong> ${vendor_name}</p>
        <p style="margin:6px 0"><strong>Date:</strong> ${bookingDate}</p>
        <p style="margin:6px 0"><strong>Time:</strong> ${bookingTime} – ${bookingEndTime}</p>
        <p style="margin:6px 0"><strong>Payment:</strong> ${paymentLabel}</p>
        <p style="margin:6px 0"><strong>Status:</strong> ${payment_method === "store" ? "Pending — pay on arrival" : "Confirmed"}</p>
      </div>
    `;

    // 3a. Customer confirmation email
    await sendEmail(
      [customer_email],
      `Booking Confirmation: ${product_title}`,
      `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h1 style="color:#10b981;">Booking Confirmed!</h1>
          <p>Hi,</p>
          <p>Your appointment for <strong>${product_title}</strong> with <strong>${vendor_name}</strong> has been successfully scheduled.</p>
          ${detailsBlock}
          <p>If you need to reschedule or cancel, please visit your profile on our website.</p>
          <p>Best regards,<br>The LMG Team</p>
        </div>
      `,
    );

    // 3b. Vendor notification email
    if (vendorEmail) {
      await sendEmail(
        [vendorEmail],
        `New Booking: ${product_title} — ${bookingDate}`,
        `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <h1 style="color:#10b981;">New Appointment Booked!</h1>
            <p>Hi ${vendor_name},</p>
            <p>A customer has just booked your service <strong>${product_title}</strong>. Here are the details:</p>
            ${detailsBlock}
            <div style="background:#fff7ed;padding:16px 20px;border-radius:10px;margin:20px 0;border:1px solid #fed7aa;">
              <p style="margin:6px 0;font-weight:bold;">Customer Contact</p>
              <p style="margin:6px 0"><strong>Email:</strong> ${customer_email}</p>
              ${customer_phone ? `<p style="margin:6px 0"><strong>Phone:</strong> ${customer_phone}</p>` : ""}
            </div>
            <p>You can view and manage this booking in your <a href="https://www.lifestylemedicinegateway.com/vendor?tab=bookings" style="color:#10b981;">Vendor Dashboard → Bookings</a>.</p>
            <p>Best regards,<br>The LMG Team</p>
          </div>
        `,
      );
    }

    // 3c. Admin notification email
    await sendEmail(
      [ADMIN_EMAIL],
      `[New Booking] ${product_title} — ${bookingDate}`,
      `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h1 style="color:#6366f1;">New Service Booking</h1>
          <p>A new booking has been made on Lifestyle Medicine Gateway.</p>
          ${detailsBlock}
          <div style="background:#f0fdf4;padding:16px 20px;border-radius:10px;margin:20px 0;border:1px solid #bbf7d0;">
            <p style="margin:6px 0;font-weight:bold;">Customer Details</p>
            <p style="margin:6px 0"><strong>Email:</strong> ${customer_email}</p>
            ${customer_phone ? `<p style="margin:6px 0"><strong>Phone:</strong> ${customer_phone}</p>` : ""}
          </div>
          <div style="background:#f0f9ff;padding:16px 20px;border-radius:10px;margin:20px 0;border:1px solid #bae6fd;">
            <p style="margin:6px 0;font-weight:bold;">Vendor Details</p>
            <p style="margin:6px 0"><strong>Store:</strong> ${vendor_name}</p>
            <p style="margin:6px 0"><strong>Email:</strong> ${vendorEmail ?? "N/A"}</p>
            <p style="margin:6px 0"><strong>Vendor ID:</strong> ${vendor_id}</p>
          </div>
          <p>Manage all bookings in the <a href="https://www.lifestylemedicinegateway.com/admin" style="color:#6366f1;">Admin Dashboard</a>.</p>
        </div>
      `,
    );

    // 4. Send SMS to customer via ClickSend
    if (CLICKSEND_USERNAME && CLICKSEND_API_KEY && customer_phone) {
      try {
        const auth = btoa(`${CLICKSEND_USERNAME}:${CLICKSEND_API_KEY}`);
        const formattedDate = new Date(booking.start_time).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        const smsRes = await fetch("https://rest.clicksend.com/v3/sms/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${auth}`,
          },
          body: JSON.stringify({
            messages: [
              {
                body: `LMG: Booking confirmed for ${product_title} on ${formattedDate}. Payment: ${payment_method === "store" ? "Pay on Store" : "Paid"}.`,
                to: customer_phone,
              },
            ],
          }),
        });
        if (!smsRes.ok) console.error("Failed to send SMS:", await smsRes.text());
      } catch (e) {
        console.error("SMS fetch error:", e);
      }
    }

    return new Response(JSON.stringify({ success: true, booking: bookingData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
