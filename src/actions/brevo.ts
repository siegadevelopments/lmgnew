"use server";

import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

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

    // 1. Add to Supabase `newsletter_subscribers`
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (SUPABASE_URL && SUPABASE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      
      const { error: dbError } = await supabase
        .from("newsletter_subscribers")
        .upsert({ email }, { onConflict: "email" });
        
      if (dbError) {
        console.error("Error adding to newsletter_subscribers:", dbError);
      }
    }

    // 2. Send email via Resend
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (RESEND_API_KEY) {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Lifestyle Medicine Gateway <hello@lifestylemedicinegateway.com>",
          to: [email],
          subject: "Your Healthy Aging Starter Kit",
          html: `
            <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; line-height: 1.5; color: #374151;">
              <h2 style="color: #134e4a;">Hi ${firstName},</h2>
              <p>Welcome to Lifestyle Medicine Gateway! As promised, here is your Healthy Aging Starter Kit.</p>
              <p>This evidence-based guide will help you improve your energy, sleep, mobility, and long-term wellbeing using the principles of lifestyle medicine.</p>
              <div style="margin: 30px 0;">
                <a href="https://lifestylemedicinegateway.com/guides/healthy-aging" style="background-color: #0f766e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Download Your Free Guide</a>
              </div>
              <p>Over the next few days, we'll be sending you some of our best tips on nutrition, sleep, and stress management.</p>
              <p>To your health,<br/>The Lifestyle Medicine Gateway Team</p>
            </div>
          `,
        }),
      });

      if (!emailRes.ok) {
        console.error("Failed to send Resend email:", await emailRes.text());
      }
    }

    // 3. Keep Brevo integration active
    const API_KEY = process.env.BREVO_API_KEY;
    if (!API_KEY) {
      console.warn("BREVO_API_KEY is not set. Simulating successful subscription.");
      // For development when API key is not present, we can simulate success.
      return { success: true };
    }

    const response = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": API_KEY,
      },
      body: JSON.stringify({
        email,
        attributes: {
          FIRSTNAME: firstName,
        },
        // Optionally provide a default list ID in the environment
        ...(process.env.BREVO_LIST_ID ? { listIds: [Number(process.env.BREVO_LIST_ID)] } : {}),
        updateEnabled: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Brevo API Error:", errorData);
      return { success: false, error: "Failed to subscribe. Please try again later." };
    }

    return { success: true };
  } catch (error) {
    console.error("Error subscribing to Brevo:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}
