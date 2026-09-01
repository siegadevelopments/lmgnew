"use server";

import { z } from "zod";

const subscribeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  email: z.string().email("Invalid email address"),
});

export async function subscribeToBrevo(formData: FormData) {
  try {
    const rawData = {
      firstName: formData.get("firstName"),
      email: formData.get("email"),
    };

    const validatedData = subscribeSchema.safeParse(rawData);

    if (!validatedData.success) {
      return {
        success: false,
        error: "Invalid input. Please provide a valid first name and email.",
      };
    }

    const { email, firstName } = validatedData.data;

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const RESEND_API_KEY = process.env.VITE_RESEND_API_KEY || process.env.RESEND_API_KEY;

    // 1. Add to Supabase `newsletter_subscribers`
    if (SUPABASE_URL && SUPABASE_KEY) {
      try {
        const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/newsletter_subscribers`, {
          method: "POST",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates"
          },
          body: JSON.stringify({ email })
        });

        if (!dbRes.ok) {
          console.error("Error adding to newsletter_subscribers:", await dbRes.text());
        }
      } catch (e) {
        console.error("Failed to insert subscriber into DB:", e);
      }
    }

    // 2. Send PDF Welcome Email via Resend API
    const pdfUrl = "https://lifestylemedicinegateway.com/Healthy_Ageing_Starter_Kit.pdf";
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1f2937; background-color: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #134e4a; font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">Lifestyle Medicine Gateway</h1>
          <p style="color: #6b7280; font-size: 14px; margin: 0;">Evidence-Based Health & Longevity</p>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />

        <h2 style="color: #0f766e; font-size: 20px; margin-top: 0;">Hi ${firstName},</h2>
        <p style="font-size: 15px; line-height: 1.6;">Welcome to Lifestyle Medicine Gateway! Here is your official <strong>Healthy Ageing Starter Kit PDF</strong>.</p>
        <p style="font-size: 15px; line-height: 1.6;">This evidence-based guide brings together practical strategies for energy, restorative sleep, anti-inflammatory nutrition, and healthy longevity.</p>

        <div style="margin: 32px 0; text-align: center;">
          <a href="${pdfUrl}" target="_blank" style="background-color: #0f766e; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            📄 Download Free PDF Guide
          </a>
        </div>

        <div style="background-color: #f0fdf4; padding: 16px; border-radius: 8px; border: 1px solid #bbf7d0; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 14px; color: #166534; line-height: 1.6;">
            <strong>Inside your Starter Kit PDF:</strong><br/>
            • The 6 Pillars of Lifestyle Medicine<br/>
            • Anti-Inflammatory Nutrition & Superfood Table<br/>
            • Printable 7-Day Daily Habit Tracker Chart<br/>
            • Australian Botanical Skincare Science
          </p>
        </div>

        <p style="font-size: 14px; color: #4b5563; line-height: 1.5;">
          If you have any questions or need personalized health advice, reply directly to this email or chat with our team on our site.
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
          © Lifestyle Medicine Gateway | <a href="https://lifestylemedicinegateway.com" style="color: #0f766e; text-decoration: none;">lifestylemedicinegateway.com</a>
        </p>
      </div>
    `;

    let emailSent = false;

    // Send via Resend API using VITE_RESEND_API_KEY / RESEND_API_KEY
    if (RESEND_API_KEY) {
      const senders = [
        "Lifestyle Medicine Gateway <notifications@lifestylemedicinegateway.com>",
        "Lifestyle Medicine Gateway <hello@lifestylemedicinegateway.com>",
        "Lifestyle Medicine Gateway <onboarding@resend.dev>"
      ];

      for (const sender of senders) {
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: sender,
              to: [email],
              subject: "Your Healthy Ageing Starter Kit PDF 📄",
              html: emailHtml,
            }),
          });

          if (res.ok) {
            emailSent = true;
            console.log(`[Email Success] Delivered PDF email to ${email} via Resend (${sender})`);
            break;
          } else {
            console.warn(`[Resend Sender ${sender} Failed]:`, await res.text());
          }
        } catch (e) {
          console.error(`[Resend Error with ${sender}]:`, e);
        }
      }
    } else {
      console.warn("No RESEND_API_KEY or VITE_RESEND_API_KEY found in environment!");
    }

    // 3. Optional Brevo Sync
    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    if (BREVO_API_KEY) {
      try {
        await fetch("https://api.brevo.com/v3/contacts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": BREVO_API_KEY,
          },
          body: JSON.stringify({
            email,
            attributes: { FIRSTNAME: firstName },
            ...(process.env.BREVO_LIST_ID ? { listIds: [Number(process.env.BREVO_LIST_ID)] } : {}),
            updateEnabled: true,
          }),
        });
      } catch (err) {
        console.error("Brevo API Sync Error:", err);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error subscribing:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}
