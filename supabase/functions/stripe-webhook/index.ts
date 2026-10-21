// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
// @ts-ignore
import Stripe from "https://esm.sh/stripe@13.10.0?target=deno";
import {
  buildBookings,
  buildEarnings,
  buildOrderItems,
  escapeHtml,
  formatBookingDate,
  shouldFulfil,
  type PaidLineItem,
} from "../_shared/order-fulfilment.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  httpClient: Stripe.createFetchHttpClient(),
});
// Deno gets Stripe's "worker" build, whose crypto is async-only: the synchronous
// webhooks.constructEvent() throws "SubtleCryptoProvider cannot be used in a synchronous context"
// on every request. constructEventAsync + the SubtleCrypto provider is the supported path.
const cryptoProvider = Stripe.createSubtleCryptoProvider();
const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const CLICKSEND_USERNAME = Deno.env.get("CLICKSEND_USERNAME");
const CLICKSEND_API_KEY = Deno.env.get("CLICKSEND_API_KEY");

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" }, status });

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY || !to) return;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from: "Lifestyle Medicine Gateway <orders@lifestylemedicinegateway.com>", to: [to], subject, html }),
  });
  if (!res.ok) console.error(`Email to ${to} failed: HTTP ${res.status}`);
}

async function sendSms(to: string, body: string) {
  if (!CLICKSEND_USERNAME || !CLICKSEND_API_KEY || !to) return;
  const res = await fetch("https://rest.clicksend.com/v3/sms/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${btoa(`${CLICKSEND_USERNAME}:${CLICKSEND_API_KEY}`)}` },
    body: JSON.stringify({ messages: [{ body, to }] }),
  });
  if (!res.ok) console.error(`SMS failed: HTTP ${res.status}`);
}

/** Notifications never block or fail the order: each one is attempted and logged on failure. */
async function attempt(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch (err) {
    console.error(`${label} failed:`, err);
  }
}

serve(async (req: Request) => {
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("No signature", { status: 400 });

  // 1. Verify the event really comes from Stripe. A failure here is permanent (400).
  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = await stripe.webhooks.constructEventAsync(body, signature, endpointSecret!, undefined, cryptoProvider);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // 2. Process it. Any failure returns 500 so Stripe retries; every step below is safe to repeat,
  // and a retry completes whatever a previous attempt didn't finish.
  try {
    const session = event.data.object as Stripe.Checkout.Session;
    if (!shouldFulfil(event.type, (session as any)?.payment_status)) {
      // Other events, and delayed payments that haven't settled yet (fulfilled later by
      // checkout.session.async_payment_succeeded, or never if the payment fails).
      return json({ received: true, fulfilled: false });
    }

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const userId = session.metadata?.user_id || null;

    // Get or create the order. orders.stripe_session_id is unique, so concurrent deliveries can't
    // create two orders; processed_at marks an order whose items, earnings, bookings and
    // notifications are all done.
    const findOrder = async () => {
      const { data, error } = await supabaseAdmin.from("orders").select("*").eq("stripe_session_id", session.id).maybeSingle();
      if (error) throw error;
      return data;
    };
    let order = await findOrder();
    if (order?.processed_at) return json({ received: true, already_processed: true });

    if (!order) {
      const total = session.amount_total != null ? session.amount_total / 100 : 0;
      const { data, error } = await supabaseAdmin
        .from("orders")
        .insert({
          user_id: userId,
          status: "confirmed",
          payment_status: "paid",
          subtotal: session.amount_subtotal != null ? session.amount_subtotal / 100 : total,
          shipping: (session.total_details?.amount_shipping ?? 0) / 100,
          tax: 0, // prices are GST-inclusive; nothing is added on top
          total,
          first_name: session.metadata?.first_name || "",
          last_name: session.metadata?.last_name || "",
          email: session.metadata?.email || session.customer_details?.email || "",
          phone: session.metadata?.phone || null,
          address: session.metadata?.address || "",
          city: session.metadata?.city || "",
          state: session.metadata?.state || "",
          zip: session.metadata?.zip || "",
          stripe_session_id: session.id,
        } as any)
        .select()
        .single();
      if (error?.code === "23505") order = await findOrder(); // a concurrent delivery created it
      else if (error) throw error;
      else order = data;
    }
    if (!order) throw new Error(`Order for session ${session.id} could not be created or found`);
    const orderId: string = order.id;

    const stripeItems = await stripe.checkout.sessions.listLineItems(session.id, { expand: ["data.price.product"], limit: 100 });
    const lineItems: PaidLineItem[] = stripeItems.data.map((item: any) => ({
      quantity: item.quantity,
      amount_total: item.amount_total,
      product: { name: item.price?.product?.name ?? item.description ?? "", metadata: item.price?.product?.metadata ?? {} },
    }));

    const hasRows = async (table: string) => {
      const { count, error } = await supabaseAdmin.from(table).select("id", { count: "exact", head: true }).eq("order_id", orderId);
      if (error) throw error;
      return (count ?? 0) > 0;
    };
    const insertAll = async (table: string, rows: unknown[]) => {
      if (rows.length === 0 || (await hasRows(table))) return;
      const { error } = await supabaseAdmin.from(table).insert(rows as any);
      if (error) throw new Error(`${table} insert failed: ${error.message}`);
    };

    // Order items, vendor earnings and bookings: each written once, errors retried by Stripe.
    await insertAll("order_items", buildOrderItems(orderId, lineItems));

    const vendorIds = [...new Set(lineItems.map((i) => i.product.metadata.vendor_id).filter(Boolean))] as string[];
    const vendors: Record<string, { commission_rate: number | null; representative_email: string | null; store_name: string | null }> = {};
    if (vendorIds.length > 0) {
      const { data, error } = await supabaseAdmin
        .from("vendor_profiles")
        .select("id, commission_rate, representative_email, store_name")
        .in("id", vendorIds);
      if (error) throw error;
      for (const v of data ?? []) vendors[v.id] = v;
    }
    const commission = Object.fromEntries(Object.entries(vendors).map(([id, v]) => [id, v.commission_rate]));
    await insertAll("vendor_earnings", buildEarnings(orderId, lineItems, commission));
    await insertAll("bookings", buildBookings(orderId, userId, lineItems));

    // Notifications. All text from customers or vendors is escaped before going into HTML.
    const ref = `LMG-${orderId.substring(0, 8).toUpperCase()}`;
    const customer = {
      name: escapeHtml(`${order.first_name ?? ""} ${order.last_name ?? ""}`.trim()),
      email: escapeHtml(order.email),
      phone: escapeHtml(order.phone || "Not provided"),
      address: `${escapeHtml(order.address)}<br />${escapeHtml(order.city)}, ${escapeHtml(order.state)} ${escapeHtml(order.zip)}`,
    };

    for (const vendorId of vendorIds) {
      const items = lineItems.filter((i) => i.product.metadata.vendor_id === vendorId);
      const rows = items
        .map((i) => `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 0;">${escapeHtml(i.product.name)}</td>
            <td style="padding: 10px 0;">${i.quantity ?? 1}</td>
            <td style="padding: 10px 0; text-align: right;">$${(i.amount_total / 100).toFixed(2)}</td>
          </tr>`)
        .join("");
      await attempt(`Vendor email ${vendorId}`, () =>
        sendEmail(vendors[vendorId]?.representative_email ?? "", `New Order Received - ${ref}`, `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <h1 style="color: #10b981;">New Order for Your Store!</h1>
            <p>Hello,</p>
            <p>You have received a new paid order on Lifestyle Medicine Gateway. Please fulfil the following items:</p>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
              <h3 style="margin-top: 0; color: #1e293b;">Customer Details</h3>
              <p style="margin: 5px 0;"><strong>Name:</strong> ${customer.name}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${customer.email}</p>
              <p style="margin: 5px 0;"><strong>Phone:</strong> ${customer.phone}</p>
              <p style="margin: 5px 0;"><strong>Address:</strong><br />${customer.address}</p>
            </div>
            <div style="margin: 20px 0;">
              <h3 style="color: #1e293b;">Items to Fulfil</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="text-align: left; border-bottom: 2px solid #e2e8f0;">
                    <th style="padding: 10px 0;">Product</th>
                    <th style="padding: 10px 0;">Qty</th>
                    <th style="padding: 10px 0; text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
            <p>Please log in to your dashboard to manage fulfilment.</p>
            <a href="https://www.lifestylemedicinegateway.com/vendor"
               style="display: inline-block; background: #10b981; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">
              Manage Fulfilment
            </a>
          </div>`),
      );
    }

    for (const item of lineItems.filter((i) => i.product.metadata.booking_start)) {
      const title = item.product.name;
      const when = formatBookingDate(item.product.metadata.booking_start as string);
      await attempt("Booking email", () =>
        sendEmail(order.email, `Booking Confirmed: ${title}`, `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h1 style="color: #10b981;">Booking Confirmed!</h1>
            <p>Hi,</p>
            <p>Your appointment for <strong>${escapeHtml(title)}</strong> has been successfully scheduled and paid online.</p>
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Date/Time:</strong> ${escapeHtml(when)}</p>
              <p style="margin: 5px 0;"><strong>Payment Status:</strong> Paid Online</p>
            </div>
            <p>Thank you for your purchase!</p>
          </div>`),
      );
      await attempt("Booking SMS", () =>
        sendSms(order.phone ?? "", `LMG: Your booking for ${title} on ${when} is confirmed and paid. Thank you!`),
      );
    }

    const amount = (session.amount_total ?? 0) / 100;
    await attempt("Admin notification", async () => {
      const { error } = await supabaseAdmin.from("notifications").insert({
        recipient_role: "admin",
        type: "order",
        title: `🛍️ New Order #${orderId.substring(0, 8)}`,
        message: `Customer ${session.customer_details?.email || "Guest"} placed an order of $${amount.toFixed(2)}.`,
        link: "/admin?tab=orders",
        metadata: { order_id: orderId, amount },
        read: false,
      });
      if (error) throw error;
    });
    await attempt("Admin email", () =>
      sendEmail("info@lifestylemedicinegateway.com", `New PAID Order: #${orderId.substring(0, 8)}`, `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h1 style="color: #10b981;">New Order Payment Received!</h1>
          <p>Order <strong>#${escapeHtml(orderId)}</strong> has been paid and confirmed.</p>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Customer:</strong> ${escapeHtml(session.customer_details?.email || "N/A")}</p>
            <p style="margin: 5px 0;"><strong>Total Amount:</strong> $${amount.toFixed(2)}</p>
            <p style="margin: 5px 0;"><strong>Stripe Session:</strong> ${escapeHtml(session.id)}</p>
          </div>
          <p>View details in the <a href="https://www.lifestylemedicinegateway.com/admin?tab=orders">Admin Dashboard</a>.</p>
        </div>`),
    );

    // Done: later deliveries of this event return immediately.
    const { error: doneError } = await supabaseAdmin.from("orders").update({ processed_at: new Date().toISOString() }).eq("id", orderId);
    if (doneError) throw doneError;

    console.log(`Order ${orderId} fulfilled for session ${session.id}`);
    return json({ received: true, fulfilled: true });
  } catch (err: any) {
    console.error(`Webhook processing failed for ${event.type} ${event.id}:`, err?.message ?? err);
    return new Response(`Webhook processing error: ${err?.message ?? "unknown"}`, { status: 500 });
  }
});
