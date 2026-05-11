// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
// @ts-ignore
import Stripe from "https://esm.sh/stripe@13.10.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  httpClient: Stripe.createFetchHttpClient(),
});
const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const CLICKSEND_USERNAME = Deno.env.get("CLICKSEND_USERNAME");
const CLICKSEND_API_KEY = Deno.env.get("CLICKSEND_API_KEY");

serve(async (req: Request) => {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("No signature", { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, endpointSecret!);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;
      const userId = session.metadata?.user_id;

      // 1. Update Order Status
      await supabaseAdmin
        .from("orders")
        .update({ payment_status: "paid", status: "confirmed" } as any)
        .eq("id", orderId);

      // 2. Fetch line items with metadata to create bookings
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ["data.price.product"],
      });

      const earningsToInsert = [];

      for (const item of lineItems.data) {
        const product = item.price?.product as Stripe.Product;
        const bookingStart = product.metadata?.booking_start;
        const bookingEnd = product.metadata?.booking_end;
        const vendorId = product.metadata?.vendor_id;

        if (vendorId) {
          // Fetch commission rate, default to 10 if not set
          const { data: vendorProfile } = await supabaseAdmin
            .from("vendor_profiles")
            .select("commission_rate")
            .eq("id", vendorId)
            .single();
            
          const commissionRate = vendorProfile?.commission_rate ?? 10;
          const itemTotal = (item.amount_total / 100); // Stripe amount is in cents
          const platformFee = itemTotal * (commissionRate / 100);
          const vendorCut = itemTotal - platformFee;
          
          earningsToInsert.push({
            vendor_id: vendorId,
            order_id: orderId,
            amount: vendorCut,
            platform_fee: platformFee,
            status: 'pending'
          });
        }

        if (bookingStart && bookingEnd) {
          // Create booking
          await supabaseAdmin.from("bookings").insert({
            order_id: orderId,
            product_id: parseInt(product.metadata.product_id),
            customer_id: userId,
            vendor_id: vendorId, // We need vendor_id in metadata too
            start_time: bookingStart,
            end_time: bookingEnd,
            status: "confirmed",
          } as any);
        }
      }

      if (earningsToInsert.length > 0) {
        await supabaseAdmin.from("vendor_earnings").insert(earningsToInsert);
        console.log(`Created ${earningsToInsert.length} earning records for order ${orderId}`);
      }

      // 3. Notify Vendors of their specific items
      const vendorItemsMap: Record<string, any[]> = {};
      for (const item of lineItems.data) {
        const product = item.price?.product as Stripe.Product;
        const vendorId = product.metadata?.vendor_id;
        if (vendorId) {
          if (!vendorItemsMap[vendorId]) vendorItemsMap[vendorId] = [];
          vendorItemsMap[vendorId].push({
            name: product.name,
            quantity: item.quantity,
            price: item.amount_total / 100 / (item.quantity || 1)
          });
        }
      }

      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (order && RESEND_API_KEY) {
        for (const [vendorId, items] of Object.entries(vendorItemsMap)) {
          const { data: vendorProfile } = await supabaseAdmin
            .from("vendor_profiles")
            .select("representative_email, store_name")
            .eq("id", vendorId)
            .single();

          const vendorEmail = vendorProfile?.representative_email;
          if (vendorEmail) {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`,
              },
              body: JSON.stringify({
                from: "Lifestyle Medicine Gateway <orders@lifestylemedicinegateway.com>",
                to: [vendorEmail],
                subject: `New Order Received - LMG-${orderId.substring(0, 8).toUpperCase()}`,
                html: `
                  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                    <h1 style="color: #10b981;">New Order for Your Store!</h1>
                    <p>Hello,</p>
                    <p>You have received a new paid order on Lifestyle Medicine Gateway. Please fulfill the following items:</p>
                    
                    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
                      <h3 style="margin-top: 0; color: #1e293b;">Customer Details</h3>
                      <p style="margin: 5px 0;"><strong>Name:</strong> ${order.first_name} ${order.last_name}</p>
                      <p style="margin: 5px 0;"><strong>Email:</strong> ${order.email}</p>
                      <p style="margin: 5px 0;"><strong>Phone:</strong> ${order.phone || "Not provided"}</p>
                      <p style="margin: 5px 0;"><strong>Address:</strong><br />${order.address}<br />${order.city}, ${order.state} ${order.zip}</p>
                    </div>

                    <div style="margin: 20px 0;">
                      <h3 style="color: #1e293b;">Items to Fulfill</h3>
                      <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                          <tr style="text-align: left; border-bottom: 2px solid #e2e8f0;">
                            <th style="padding: 10px 0;">Product</th>
                            <th style="padding: 10px 0;">Qty</th>
                            <th style="padding: 10px 0; text-align: right;">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${items.map(item => `
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                              <td style="padding: 10px 0;">${item.name}</td>
                              <td style="padding: 10px 0;">${item.quantity}</td>
                              <td style="padding: 10px 0; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>
                    </div>

                    <p>Please log in to your dashboard to manage fulfillment.</p>
                    <a href="https://lifestylemedicinegateway.com/vendor" 
                       style="display: inline-block; background: #10b981; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">
                      Manage Fulfillment
                    </a>
                  </div>
                `,
              }),
            });
          }
        }
      }

      // 4. Trigger Email & SMS Notifications for Bookings

      for (const item of lineItems.data) {
        const product = item.price?.product as Stripe.Product;
        const bookingStart = product.metadata?.booking_start;

        if (bookingStart && order) {
          const productTitle = product.name;
          const customerEmail = order.email;
          const customerPhone = order.phone;
          const formattedDate = new Date(bookingStart).toLocaleString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          // Send Email
          if (RESEND_API_KEY) {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`,
              },
              body: JSON.stringify({
                from: "Lifestyle Medicine Gateway <orders@lifestylemedicinegateway.com>",
                to: [customerEmail],
                subject: `Booking Confirmed: ${productTitle}`,
                html: `
                  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h1 style="color: #10b981;">Booking Confirmed!</h1>
                    <p>Hi,</p>
                    <p>Your appointment for <strong>${productTitle}</strong> has been successfully scheduled and paid online.</p>
                    <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                      <p style="margin: 5px 0;"><strong>Date/Time:</strong> ${formattedDate}</p>
                      <p style="margin: 5px 0;"><strong>Payment Status:</strong> Paid Online</p>
                    </div>
                    <p>Thank you for your purchase!</p>
                  </div>
                `,
              }),
            });
          }

          // Send SMS
          if (CLICKSEND_USERNAME && CLICKSEND_API_KEY && customerPhone) {
            const auth = btoa(`${CLICKSEND_USERNAME}:${CLICKSEND_API_KEY}`);
            await fetch("https://rest.clicksend.com/v3/sms/send", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Basic ${auth}`,
              },
              body: JSON.stringify({
                messages: [
                  {
                    body: `LMG: Your booking for ${productTitle} on ${formattedDate} is confirmed and paid. Thank you!`,
                    to: customerPhone,
                  },
                ],
              }),
            });
          }
        }
      }

      console.log(`Order ${orderId} completed and paid. Notifications sent.`);

      // 4. Notify Admin of Paid Order
      if (RESEND_API_KEY) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Lifestyle Medicine Gateway <orders@lifestylemedicinegateway.com>",
            to: ["info@lifestylemedicinegateway.com"],
            subject: `New PAID Order: #${orderId.substring(0, 8)}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h1 style="color: #10b981;">New Order Payment Received!</h1>
                <p>Order <strong>#${orderId}</strong> has been paid and confirmed.</p>
                <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 5px 0;"><strong>Customer:</strong> ${session.customer_details?.email || "N/A"}</p>
                  <p style="margin: 5px 0;"><strong>Total Amount:</strong> $${(session.amount_total! / 100).toFixed(2)}</p>
                  <p style="margin: 5px 0;"><strong>Stripe Session:</strong> ${session.id}</p>
                </div>
                <p>View details in the <a href="https://lifestylemedicinegateway.com/admin/orders">Admin Dashboard</a>.</p>
              </div>
            `,
          }),
        });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});
