// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAuth } from "../_shared/auth.ts";

// @ts-ignore
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_SENDERS = [
  "noreply@lifestylemedicinegateway.com",
  "orders@lifestylemedicinegateway.com",
  "sales@lifestylemedicinegateway.com",
  "bookings@lifestylemedicinegateway.com",
  "support@lifestylemedicinegateway.com",
];

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let { to, subject, html, fromName, fromEmail } = await req.json();

    // Admins / internal callers may send anywhere. Any other signed-in user may only email their
    // own address from an approved sender — this stops the function acting as an open mail relay.
    if (await requireAuth(req, ["admin", "service"], corsHeaders)) {
      const userClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
      );
      const { data: { user } } = await userClient.auth.getUser();
      if (!user?.email) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const recipients = (Array.isArray(to) ? to : [to]).map((e: string) => String(e).toLowerCase());
      if (recipients.length !== 1 || recipients[0] !== user.email.toLowerCase()) {
        return new Response(JSON.stringify({ error: "Forbidden: you can only email your own address" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (!ALLOWED_SENDERS.includes(String(fromEmail ?? "").toLowerCase())) fromEmail = undefined;
    }
    if (typeof subject === "string") subject = subject.replace(/[\r\n]+/g, " ");

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    // Default to noreply if not specified
    const senderName = fromName || "Lifestyle Medicine Gateway";
    const senderEmail = fromEmail || "noreply@lifestylemedicinegateway.com";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${senderName} <${senderEmail}>`,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    });

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: res.ok ? 200 : 400,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "An unknown error occurred" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
