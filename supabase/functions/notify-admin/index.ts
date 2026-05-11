// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = "info@lifestylemedicinegateway.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { table, record, type } = payload;

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    let subject = "";
    let html = "";

    if (table === "profiles" && type === "INSERT") {
      subject = `New Registration: ${record.full_name || "New User"}`;
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #10b981;">New User Registered</h2>
          <p>A new user has joined Lifestyle Medicine Gateway.</p>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Name:</strong> ${record.full_name || "N/A"}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${record.email || "N/A"}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p>View user in <a href="https://lifestylemedicinegateway.com/admin/users">Admin Dashboard</a></p>
        </div>
      `;
    } else if (table === "contact_messages" && type === "INSERT") {
      subject = `New Contact Message: ${record.subject}`;
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #6366f1;">New Contact Inquiry</h2>
          <p>You have received a new message via the contact form.</p>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>From:</strong> ${record.name} (${record.email})</p>
            <p style="margin: 5px 0;"><strong>Subject:</strong> ${record.subject}</p>
            <p style="margin: 5px 0; border-top: 1px solid #ddd; padding-top: 10px; margin-top: 10px;">
              <strong>Message:</strong><br/>
              ${record.message}
            </p>
          </div>
        </div>
      `;
    }

    if (subject && html) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "LMG Notifications <notifications@lifestylemedicinegateway.com>",
          to: [ADMIN_EMAIL],
          subject,
          html,
        }),
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
