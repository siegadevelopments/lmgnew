import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import Stripe from "https://esm.sh/stripe@13.10.0?target=deno";
import { priceCart, safeRedirectUrl } from "../_shared/cart-pricing.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
    );

    // Guest checkout is allowed: `user` is null for visitors without an account (the order is
    // then created with user_id = null by the webhook). Bookings need an account — see below.
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    const { items: clientItems, success_url, cancel_url, customer_email, shipping_details } =
      await req.json();

    // Never trust prices/names from the browser: re-read every product from the database and
    // price the cart from that. The client only chooses product, variant, quantity and booking.
    const productIds = Array.isArray(clientItems)
      ? [...new Set(clientItems.map((i: any) => Number(i?.product_id)).filter(Number.isFinite))]
      : [];
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const { data: dbProducts, error: productsError } = await supabaseAdmin
      .from("products")
      .select("id, title, slug, price, image_url, stock, status, vendor_id, variants, vendor_profiles (is_approved, is_live)")
      .in("id", productIds);
    if (productsError) throw new Error("Could not load products. Please try again.");

    const priced = priceCart(clientItems, dbProducts ?? []);
    if (!priced.ok) {
      return new Response(JSON.stringify({ error: priced.error }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    const items = priced.items;

    if (!user && items.some((i) => i.booking)) {
      return new Response(JSON.stringify({ error: "Please log in to book a service." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // No "orders" row is created here — an order should only exist once it's actually paid
    // for. Everything the webhook needs to build the order later (shipping details, per-item
    // vendor/variant/image info) travels through Stripe's own metadata instead, and the
    // webhook (checkout.session.completed) does the real insert once payment succeeds.
    const line_items = items.map((item) => ({
      price_data: {
        currency: "aud",
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : [],
          metadata: {
            product_id: String(item.product_id),
            vendor_id: item.vendor_id,
            variant_id: item.variant_id != null ? item.variant_id.toString() : "",
            image: item.image,
            slug: item.slug,
            booking_start: item.booking?.start_time || "",
            booking_end: item.booking?.end_time || "",
          },
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    // Same rule as src/lib/checkout-pricing.ts (AUD, GST-inclusive prices): free shipping over
    // $50 and for bookings-only carts, otherwise a flat $5.99. Stripe's total is what is charged,
    // so shipping has to be a real shipping option, not just a line on our own page.
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const bookingsOnly = items.length > 0 && items.every((i) => i.booking);
    const shippingFee = bookingsOnly || subtotal > 50 ? 0 : 5.99;

    const session = await stripe.checkout.sessions.create({
      // No payment_method_types: Stripe then offers every method enabled in the Dashboard
      // (cards, Apple Pay, Google Pay, Link), filtered to what suits AUD and the buyer's device.
      line_items,
      mode: "payment",
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: Math.round(shippingFee * 100), currency: "aud" },
            display_name: shippingFee === 0 ? "Free shipping" : "Standard shipping (Australia)",
          },
        },
      ],
      success_url: safeRedirectUrl(success_url, "/checkout/success"),
      cancel_url: safeRedirectUrl(cancel_url, "/checkout"),
      customer_email: customer_email,
      metadata: {
        user_id: user?.id ?? "",
        email: customer_email || "",
        first_name: shipping_details.firstName || "",
        last_name: shipping_details.lastName || "",
        phone: shipping_details.phone || "",
        address: shipping_details.address || "",
        city: shipping_details.city || "",
        state: shipping_details.state || "",
        zip: shipping_details.zip || "",
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "Unknown error occurred" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
