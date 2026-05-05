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

serve(async (req) => {
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

    // 1. Create order
    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .insert({
        user_id: user.id,
        subtotal: items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0),
        total: items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0),
        status: "pending",
        payment_status: "unpaid",
        first_name: shipping_details.firstName,
        last_name: shipping_details.lastName,
        email: customer_email,
        phone: shipping_details.phone,
        address: shipping_details.address,
        city: shipping_details.city,
        state: shipping_details.state,
        zip: shipping_details.zip,
      } as any)
      .select()
      .single();

    if (orderError) throw orderError;

    // 2. Create order items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.name,
      price: item.price,
      quantity: item.quantity,
      vendor_id: item.vendor_id,
      variant_id: item.variant_id,
      product_image: item.image,
    }));

    await supabaseClient.from("order_items").insert(orderItems as any);

    // 3. Prepare line items
    const line_items = items.map((item: any) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : [],
          metadata: {
            product_id: item.product_id.toString(),
            vendor_id: item.vendor_id || "",
            booking_start: item.booking?.start_time || "",
            booking_end: item.booking?.end_time || "",
          },
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    // 4. Create session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: success_url,
      cancel_url: cancel_url,
      customer_email: customer_email,
      metadata: {
        order_id: order.id,
        user_id: user.id,
      },
    });

    await supabaseClient
      .from("orders")
      .update({ stripe_session_id: session.id } as any)
      .eq("id", order.id);

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
