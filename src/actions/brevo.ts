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
        email: validatedData.data.email,
        attributes: {
          FIRSTNAME: validatedData.data.firstName,
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
