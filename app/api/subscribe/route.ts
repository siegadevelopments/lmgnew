import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/server-admin";
import { freeGuidePath, freeGuides, welcomeEmail } from "@/lib/free-guides";

// Newsletter sign-up (the site popup). Saves the subscriber with the service role (the browser
// could insert but not update, so re-subscribing an existing address failed) and emails the free
// guide when one is offered. A hidden "website" field catches simple bots.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const recent = new Map<string, number>(); // best-effort per-instance throttle by IP

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const email = String(body?.email ?? "").trim().toLowerCase();
  const guideSlug = typeof body?.guide === "string" && freeGuides[body.guide] ? body.guide : null;
  const guideUrl = guideSlug ? freeGuidePath(guideSlug) : null;

  if (body?.website) return NextResponse.json({ ok: true, guideUrl }); // bot: pretend it worked
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const last = recent.get(ip) ?? 0;
  if (Date.now() - last < 10_000) return NextResponse.json({ error: "Please wait a moment and try again." }, { status: 429 });
  recent.set(ip, Date.now());

  try {
    const db = getAdminSupabase();
    const { data: existing } = await db.from("newsletter_subscribers").select("id").eq("email", email).maybeSingle();
    if (!existing) {
      const { error } = await db.from("newsletter_subscribers").insert({ email });
      if (error && error.code !== "23505") throw error;
    }

    const key = process.env.RESEND_API_KEY;
    if (key) {
      const { subject, html } = welcomeEmail(guideSlug);
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ from: "Lifestyle Medicine Gateway <hello@lifestylemedicinegateway.com>", to: [email], subject, html }),
      });
      if (!res.ok) console.error(`subscribe: welcome email failed: HTTP ${res.status}`);
    } else {
      console.warn("subscribe: RESEND_API_KEY not set; welcome email skipped");
    }
    return NextResponse.json({ ok: true, guideUrl });
  } catch (err: any) {
    console.error("subscribe failed", err?.message ?? err);
    return NextResponse.json({ error: "We couldn't sign you up. Please try again." }, { status: 500 });
  }
}
