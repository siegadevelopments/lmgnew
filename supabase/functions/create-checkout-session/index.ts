import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import Stripe from "https://esm.sh/stripe@13.10.0?target=deno";

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
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } },
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const { items, success_url, cancel_url, customer_email, shipping_details } = await req.json();

    // No "orders" row is created here — an order should only exist once it's actually paid
    // for. Everything the webhook needs to build the order later (shipping details, per-item
    // vendor/variant/image info) travels through Stripe's own metadata instead, and the
    // webhook (checkout.session.completed) does the real insert once payment succeeds.
    const line_items = items.map((item: any) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : [],
          metadata: {
            product_id: item.product_id.toString(),
            vendor_id: item.vendor_id || "",
            variant_id: item.variant_id != null ? item.variant_id.toString() : "",
            image: item.image || "",
            slug: item.slug || "",
            booking_start: item.booking?.start_time || "",
            booking_end: item.booking?.end_time || "",
          },
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: success_url,
      cancel_url: cancel_url,
      customer_email: customer_email,
      metadata: {
        user_id: user.id,
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
