// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
// @ts-ignore
import Stripe from "https://esm.sh/stripe@13.10.0?target=deno";
import {
  buildBookings,
  buildEarnings,
  buildOrderItems,
  computeRefundReversals,
  escapeHtml,
  formatBookingDate,
  orderConfirmationEmail,
  refundEmail,
  shouldFulfil,
  statusAfterRefund,
  stockItems,
  type PaidLineItem,
} from "../_shared/order-fulfilment.ts";
import { attributionFromMetadata } from "../_shared/attribution.ts";

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
  // Never skip silently: a missing key or recipient is why an expected email doesn't arrive.
  if (!RESEND_API_KEY) return console.warn(`Email skipped (RESEND_API_KEY not set): ${subject}`);
  if (!to) return console.warn(`Email skipped (no recipient address): ${subject}`);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from: "Lifestyle Medicine Gateway <orders@lifestylemedicinegateway.com>", to: [to], subject, html }),
  });
  if (!res.ok) console.error(`Email to ${to} failed: HTTP ${res.status}`);
}

async function sendSms(to: string, body: string) {
  if (!CLICKSEND_USERNAME || !CLICKSEND_API_KEY) return console.warn("SMS skipped (ClickSend not configured)");
  if (!to) return console.warn("SMS skipped (no phone number)");
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

/**
 * charge.refunded: reverse the vendors' share of what was refunded and update the order.
 * Stripe sends the charge's cumulative amount_refunded; orders.refunded_cents records how much
 * this order has already reversed, so replays and repeated partial refunds never double-count.
 */
async function handleRefund(charge: Stripe.Charge): Promise<Response> {
  const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
  const paymentIntent = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!paymentIntent) return json({ received: true, refund: "no payment intent" });

  // Orders created by this version store the payment intent; older ones are found via Stripe.
  let { data: order, error } = await supabaseAdmin.from("orders").select("*").eq("stripe_payment_intent", paymentIntent).maybeSingle();
  if (error) throw error;
  if (!order) {
    const sessions = await stripe.checkout.sessions.list({ payment_intent: paymentIntent, limit: 1 });
    const sessionId = sessions.data[0]?.id;
    if (sessionId) {
      ({ data: order, error } = await supabaseAdmin.from("orders").select("*").eq("stripe_session_id", sessionId).maybeSingle());
      if (error) throw error;
      if (order) await supabaseAdmin.from("orders").update({ stripe_payment_intent: paymentIntent }).eq("id", order.id);
    }
  }
  // Not one of our checkout orders (or it was never fulfilled): nothing to reverse.
  if (!order) return json({ received: true, refund: "no matching order" });

  const previous: number = order.refunded_cents ?? 0;
  const total = charge.amount_refunded;
  if (total <= previous) return json({ received: true, refund: "already recorded" });

  // Claim this refund amount first, conditionally, so two deliveries can't both reverse it.
  const { data: claimed, error: claimError } = await supabaseAdmin
    .from("orders")
    .update({ refunded_cents: total })
    .eq("id", order.id)
    .eq("refunded_cents", previous)
    .select("id");
  if (claimError) throw claimError;
  if (!claimed || claimed.length === 0) return json({ received: true, refund: "handled by another delivery" });

  try {
    const { data: earnings, error: earningsError } = await supabaseAdmin
      .from("vendor_earnings")
      .select("vendor_id, amount, platform_fee")
      .eq("order_id", order.id);
    if (earningsError) throw earningsError;

    const reversals = computeRefundReversals(order.id, (earnings ?? []).map((e: any) => ({
      vendor_id: e.vendor_id, amount: Number(e.amount), platform_fee: Number(e.platform_fee),
    })), charge.amount, total, previous);
    if (reversals.length > 0) {
      const { error: insertError } = await supabaseAdmin.from("vendor_earnings").insert(reversals as any);
      if (insertError) throw insertError;
    }

    const full = total >= charge.amount;
    const after = statusAfterRefund(order.status, full);

    // A full refund of an order that hadn't shipped: put the stock back (once) and cancel its
    // bookings. Shipped orders keep their stock change; returns are handled by the vendor.
    if (full && after.status === "cancelled" && order.stripe_session_id) {
      const items = await stripe.checkout.sessions.listLineItems(order.stripe_session_id, { expand: ["data.price.product"], limit: 100 });
      const { error: restockError } = await supabaseAdmin.rpc("adjust_order_stock", {
        p_order_id: order.id,
        p_items: stockItems(items.data.map((item: any) => ({
          quantity: item.quantity,
          amount_total: item.amount_total,
          product: { name: item.price?.product?.name ?? "", metadata: item.price?.product?.metadata ?? {} },
        }))),
        p_restock: true,
      });
      if (restockError) throw new Error(`Restock failed: ${restockError.message}`);
    }
    if (full) {
      await attempt("Cancel refunded bookings", async () => {
        const { error: bookingsError } = await supabaseAdmin
          .from("bookings")
          .update({ status: "cancelled" })
          .eq("order_id", order.id)
          .in("status", ["pending", "confirmed"]);
        if (bookingsError) throw bookingsError;
      });
    }

    const { error: statusError } = await supabaseAdmin.from("orders").update(after).eq("id", order.id);
    if (statusError) throw statusError;

    const refunded = (total - previous) / 100;
    await attempt("Customer refund email", () => {
      const { subject, html } = refundEmail({
        reference: `LMG-${String(order.id).substring(0, 8).toUpperCase()}`,
        firstName: order.first_name ?? "",
        refundedCents: total - previous,
        full,
      });
      return sendEmail(order.email ?? "", subject, html);
    });
    await attempt("Admin refund notification", async () => {
      const { error: notifError } = await supabaseAdmin.from("notifications").insert({
        recipient_role: "admin",
        type: "order",
        title: `↩️ Refund on order #${String(order.id).substring(0, 8)}`,
        message: `$${refunded.toFixed(2)} refunded${full ? " (full refund)" : ""}. Vendor earnings reversed.`,
        link: "/admin?tab=orders",
        metadata: { order_id: order.id, refunded },
        read: false,
      });
      if (notifError) throw notifError;
    });

    console.log(`Refund of ${total - previous} cents recorded for order ${order.id}`);
    return json({ received: true, refund: "recorded", reversals: reversals.length });
  } catch (err) {
    // Release the claim so Stripe's retry reverses it.
    await supabaseAdmin.from("orders").update({ refunded_cents: previous }).eq("id", order.id).eq("refunded_cents", total);
    throw err;
  }
}

// Deno's built-in server. The old std@0.168.0 serve() calls Deno.core.runMicrotasks(), which the
// current Supabase runtime doesn't support ("event loop error" after every request).
Deno.serve(async (req: Request) => {
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
    if (event.type === "charge.refunded") {
      return await handleRefund(event.data.object as Stripe.Charge);
    }

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
      const orderRow: Record<string, unknown> = {
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
          stripe_payment_intent: typeof session.payment_intent === "string" ? session.payment_intent : null,
          attribution: attributionFromMetadata(session.metadata),
      };
      const insertOrder = (row: Record<string, unknown>) => supabaseAdmin.from("orders").insert(row as any).select().single();
      let { data, error } = await insertOrder(orderRow);
      // orders.attribution comes from 20261027_orders_attribution.sql. If that hasn't been run yet,
      // save the order without it rather than failing the payment.
      if (error && /attribution/.test(`${error.message ?? ""}`) && (error.code === "PGRST204" || error.code === "42703")) {
        console.warn("orders.attribution column missing; order saved without attribution");
        const { attribution: _omit, ...withoutAttribution } = orderRow;
        ({ data, error } = await insertOrder(withoutAttribution));
      }
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
    const vendors: Record<string, { commission_rate: number | null; store_name: string | null }> = {};
    if (vendorIds.length > 0) {
      // vendor_profiles has no email column (an earlier version asked for representative_email,
      // which made this query fail): vendor emails come from their auth account below.
      const { data, error } = await supabaseAdmin
        .from("vendor_profiles")
        .select("id, commission_rate, store_name")
        .in("id", vendorIds);
      if (error) throw error;
      for (const v of data ?? []) vendors[v.id] = v;
    }
    const commission = Object.fromEntries(Object.entries(vendors).map(([id, v]) => [id, v.commission_rate]));
    // Vendors pay their own postage, so the shipping charged is passed to them (no commission).
    const shippingCents = session.total_details?.amount_shipping ?? 0;
    await insertAll("vendor_earnings", buildEarnings(orderId, lineItems, commission, shippingCents));
    await insertAll("bookings", buildBookings(orderId, userId, lineItems));

    // Reduce stock once per order (the function records it on the order, atomically).
    const { error: stockError } = await supabaseAdmin.rpc("adjust_order_stock", {
      p_order_id: orderId,
      p_items: stockItems(lineItems),
      p_restock: false,
    });
    if (stockError) throw new Error(`Stock adjustment failed: ${stockError.message}`);

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
      await attempt(`Vendor email ${vendorId}`, async () => {
        // A vendor profile's id is the vendor's auth user id (same lookup as confirm-booking).
        const { data: vendorUser, error: vendorUserError } = await supabaseAdmin.auth.admin.getUserById(vendorId);
        if (vendorUserError) throw vendorUserError;
        if (!vendorUser?.user?.email) console.warn(`Vendor ${vendorId} has no login email; order email not sent`);
        await sendEmail(vendorUser?.user?.email ?? "", `New Order Received - ${ref}`, `
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
          </div>`);
      });
    }

    // Customer order confirmation (one email; booking times are listed against their items).
    await attempt("Customer confirmation email", () => {
      const { subject, html } = orderConfirmationEmail({
        reference: ref,
        firstName: order.first_name ?? "",
        items: lineItems,
        subtotalCents: session.amount_subtotal ?? 0,
        shippingCents: session.total_details?.amount_shipping ?? 0,
        totalCents: session.amount_total ?? 0,
        address: { line: order.address ?? "", city: order.city ?? "", state: order.state ?? "", zip: order.zip ?? "" },
        hasAccount: !!userId,
      });
      return sendEmail(order.email, subject, html);
    });

    for (const item of lineItems.filter((i) => i.product.metadata.booking_start)) {
      const when = formatBookingDate(item.product.metadata.booking_start as string);
      await attempt("Booking SMS", () =>
        sendSms(order.phone ?? "", `LMG: Your booking for ${item.product.name} on ${when} is confirmed and paid. Thank you!`),
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
