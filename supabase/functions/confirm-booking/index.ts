// Pay-in-store service bookings. Online-paid bookings go through Stripe Checkout and the
// stripe-webhook function instead.
//
// Security (payment audit, 2026-10-21): this function used to take the service title, provider
// name, vendor, customer email and phone from the browser and put them, unescaped, into emails
// and an SMS. Any signed-in user could make the site send branded email to any address and SMS to
// any number, with any wording. Now only the product, the time slot and a phone number come from
// the browser; everything else is read from the database or the user's own account, all email
// text is escaped, and each user is limited to MAX_BOOKINGS_PER_DAY bookings.
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { escapeHtml, formatBookingDate } from "../_shared/order-fulfilment.ts";
import { MAX_BOOKINGS_PER_DAY, cleanPhone, validateService, validateSlot } from "../_shared/booking-rules.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const CLICKSEND_USERNAME = Deno.env.get("CLICKSEND_USERNAME");
const CLICKSEND_API_KEY = Deno.env.get("CLICKSEND_API_KEY");
const ADMIN_EMAIL = "info@lifestylemedicinegateway.com";
const FROM_EMAIL = "LMG Notifications <notifications@lifestylemedicinegateway.com>";

const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status });

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) return console.warn(`Email skipped (RESEND_API_KEY not set): ${subject}`);
  if (!to) return console.warn(`Email skipped (no recipient address): ${subject}`);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
    });
    if (!res.ok) console.error(`[Resend] email to ${to} failed (HTTP ${res.status}):`, await res.text());
  } catch (e) {
    console.error("[Resend] fetch error:", e);
  }
}

async function sendSms(to: string, body: string) {
  if (!CLICKSEND_USERNAME || !CLICKSEND_API_KEY) return console.warn("SMS skipped (ClickSend not configured)");
  try {
    const res = await fetch("https://rest.clicksend.com/v3/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${btoa(`${CLICKSEND_USERNAME}:${CLICKSEND_API_KEY}`)}` },
      body: JSON.stringify({ messages: [{ body, to }] }),
    });
    if (!res.ok) console.error("SMS failed:", await res.text());
  } catch (e) {
    console.error("SMS fetch error:", e);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const supabaseUser = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) return reply({ error: "Please log in to book a service." }, 401);

    // Only these come from the browser; anything else in the body is ignored.
    const body = await req.json().catch(() => ({}));
    const productId = Number(body?.product_id);
    const startTime = body?.booking?.start_time;
    const endTime = body?.booking?.end_time;
    if (!Number.isInteger(productId)) return reply({ error: "This service isn't available for booking." }, 400);

    const slot = validateSlot(startTime, endTime, new Date());
    if (!slot.ok) return reply({ error: slot.error }, slot.status);

    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("id, title, status, product_type, vendor_id, vendor_profiles (store_name, is_approved, is_live)")
      .eq("id", productId)
      .maybeSingle();
    if (productError) throw productError;
    const service = validateService(product as any);
    if (!service.ok) return reply({ error: service.error }, service.status);
    const vendorId: string = product!.vendor_id;
    const storeName: string = (product as any).vendor_profiles?.store_name ?? "the provider";

    // Rate limit: caps how many emails/SMS one account can trigger.
    const since = new Date(Date.now() - 86400_000).toISOString();
    const { count: recent, error: recentError } = await supabaseAdmin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", user.id)
      .gte("created_at", since);
    if (recentError) throw recentError;
    if ((recent ?? 0) >= MAX_BOOKINGS_PER_DAY) {
      return reply({ error: "You've made several bookings today. Please contact us if you need another." }, 429);
    }

    // No double-booking of the same service.
    const { count: clashes, error: clashError } = await supabaseAdmin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("product_id", productId)
      .neq("status", "cancelled")
      .lt("start_time", endTime)
      .gt("end_time", startTime);
    if (clashError) throw clashError;
    if ((clashes ?? 0) > 0) return reply({ error: "That time has just been booked. Please choose another." }, 409);

    // The customer's own details: email from their login, phone from their profile, else the
    // number they typed (validated). Never an address chosen by the browser.
    const customerEmail = user.email ?? "";
    const { data: profile } = await supabaseAdmin.from("profiles").select("phone").eq("id", user.id).maybeSingle();
    const customerPhone = cleanPhone(profile?.phone) ?? cleanPhone(body?.customer_phone);

    const { data: bookingData, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .insert({
        customer_id: user.id,
        product_id: productId,
        vendor_id: vendorId,
        start_time: startTime,
        end_time: endTime,
        status: "pending", // pay in store; online-paid bookings are created by stripe-webhook
      } as any)
      .select()
      .single();
    if (bookingError) throw bookingError;

    const { data: vendorUser } = await supabaseAdmin.auth.admin.getUserById(vendorId);
    const vendorEmail = vendorUser?.user?.email ?? "";
    if (!vendorEmail) console.warn(`Vendor ${vendorId} has no login email; booking email not sent`);

    const when = formatBookingDate(startTime);
    const until = formatBookingDate(endTime);
    const title = escapeHtml(product!.title);
    const store = escapeHtml(storeName);
    const details = `
      <div style="background:#f9fafb;padding:16px 20px;border-radius:10px;margin:20px 0;border:1px solid #e5e7eb;">
        <p style="margin:6px 0"><strong>Service:</strong> ${title}</p>
        <p style="margin:6px 0"><strong>Provider:</strong> ${store}</p>
        <p style="margin:6px 0"><strong>Starts:</strong> ${escapeHtml(when)}</p>
        <p style="margin:6px 0"><strong>Ends:</strong> ${escapeHtml(until)}</p>
        <p style="margin:6px 0"><strong>Payment:</strong> Pay at the store or clinic</p>
        <p style="margin:6px 0"><strong>Status:</strong> Pending, pay on arrival</p>
      </div>`;
    const contact = `
      <p style="margin:6px 0"><strong>Email:</strong> ${escapeHtml(customerEmail)}</p>
      ${customerPhone ? `<p style="margin:6px 0"><strong>Phone:</strong> ${escapeHtml(customerPhone)}</p>` : ""}`;

    await sendEmail(customerEmail, `Booking received: ${product!.title}`, `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h1 style="color:#10b981;">Booking received</h1>
        <p>Hi,</p>
        <p>Your appointment for <strong>${title}</strong> with <strong>${store}</strong> has been scheduled.</p>
        ${details}
        <p>To reschedule or cancel, visit your profile on our website.</p>
        <p>Best regards,<br>The LMG Team</p>
      </div>`);

    await sendEmail(vendorEmail, `New booking: ${product!.title}, ${when}`, `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h1 style="color:#10b981;">New appointment booked</h1>
        <p>Hi ${store},</p>
        <p>A customer has booked <strong>${title}</strong>.</p>
        ${details}
        <div style="background:#fff7ed;padding:16px 20px;border-radius:10px;margin:20px 0;border:1px solid #fed7aa;">
          <p style="margin:6px 0;font-weight:bold;">Customer contact</p>
          ${contact}
        </div>
        <p>Manage it in your <a href="https://www.lifestylemedicinegateway.com/vendor?tab=bookings" style="color:#10b981;">Vendor Dashboard → Bookings</a>.</p>
      </div>`);

    await sendEmail(ADMIN_EMAIL, `[New Booking] ${product!.title}, ${when}`, `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h1 style="color:#6366f1;">New service booking</h1>
        ${details}
        <div style="background:#f0fdf4;padding:16px 20px;border-radius:10px;margin:20px 0;border:1px solid #bbf7d0;">
          <p style="margin:6px 0;font-weight:bold;">Customer</p>
          ${contact}
        </div>
        <p style="margin:6px 0"><strong>Vendor email:</strong> ${escapeHtml(vendorEmail || "N/A")}</p>
        <p>Manage bookings in the <a href="https://www.lifestylemedicinegateway.com/admin" style="color:#6366f1;">Admin Dashboard</a>.</p>
      </div>`);

    if (customerPhone) {
      await sendSms(customerPhone, `LMG: Booking for ${product!.title} on ${when} received. Pay at the store.`);
    }

    return reply({ success: true, booking: bookingData });
  } catch (error: any) {
    console.error("confirm-booking failed:", error?.message ?? error);
    return reply({ error: "We couldn't complete your booking. Please try again." }, 500);
  }
});
