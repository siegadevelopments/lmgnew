// Free guides offered in exchange for an email address (the popup and /api/subscribe), and
// published at /free-guides/[slug]. Written to marketing/social/brand-voice.md: practical,
// evidence-aware, Australian English, no promises or medical claims, and a nudge to see a GP.

export interface FreeGuide {
  slug: string;
  title: string;
  summary: string;
  intro: string;
  /** The wellness category whose products and buying guide follow the guide. */
  categorySlug: string;
  days: { title: string; why: string; action: string }[];
  closing: string;
  seeYourGp: string;
}

export const freeGuides: Record<string, FreeGuide> = {
  "7-day-sleep-reset": {
    slug: "7-day-sleep-reset",
    title: "Your 7-day sleep reset",
    summary: "Seven small, practical habits to help you build a calmer, more consistent sleep routine, one day at a time.",
    intro:
      "Good sleep is rarely about one big change. It usually comes from a handful of small habits that make it easier for your body to wind down at night and wake up in the morning. Try one new habit each day for a week, keep the ones that suit you, and notice how you feel.",
    categorySlug: "sleep-recovery",
    days: [
      {
        title: "Pick a wake-up time and keep it",
        why: "Your body clock likes routine. Waking at roughly the same time every day, weekends included, is one of the most commonly recommended steps for steadier sleep.",
        action: "Choose a wake-up time you can keep all week, set one alarm, and get up when it goes off.",
      },
      {
        title: "Get morning daylight",
        why: "Natural light early in the day helps set your body clock, which can make it easier to feel sleepy at the right time in the evening.",
        action: "Spend 10 to 15 minutes outside within an hour or so of waking: a short walk, breakfast on the balcony, or coffee by an open window.",
      },
      {
        title: "Set a caffeine cut-off",
        why: "Caffeine can stay in your system for several hours, so an afternoon coffee may still be affecting you at bedtime.",
        action: "Have your last coffee, tea, cola or energy drink before about 2pm today, and see whether evenings feel different.",
      },
      {
        title: "Create a wind-down routine",
        why: "A predictable routine signals that the day is ending. Bright screens and work emails late at night can make it harder to switch off.",
        action: "Set a 30-minute wind-down alarm before bed. Dim the lights, put your phone on the charger outside the bedroom if you can, and do something calm: reading, a shower, gentle stretching.",
      },
      {
        title: "Make your bedroom sleep-friendly",
        why: "Most people sleep better in a room that's cool, dark and quiet.",
        action: "Check your room tonight: block light from windows and devices, keep it comfortably cool, and use earplugs or a fan if noise is a problem.",
      },
      {
        title: "Move more, and eat earlier",
        why: "Regular daytime activity is associated with better sleep, while a large meal or alcohol close to bedtime can make sleep lighter and more broken.",
        action: "Fit in some movement today, even a brisk walk, and try to finish dinner two to three hours before bed.",
      },
      {
        title: "Park your worries",
        why: "A busy mind is one of the most common reasons people lie awake.",
        action: "Before your wind-down, write tomorrow's to-do list and anything on your mind. In bed, try slow breathing: in for four counts, out for six, for a few minutes.",
      },
    ],
    closing:
      "Look back over the week. Which habits felt easy, and which made a difference? Keep two or three that suit you. Consistency matters more than doing everything perfectly.",
    seeYourGp:
      "This guide is general information, not medical advice. If you've had trouble sleeping for several weeks, feel very sleepy during the day, or someone notices you snoring loudly or stopping breathing in your sleep, please talk to your GP.",
  },
};

export const freeGuidePath = (slug: string) => `/free-guides/${slug}`;

const SITE_URL = "https://www.lifestylemedicinegateway.com";

const escapeHtml = (v: unknown) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Welcome email for a new subscriber, linking the free guide they signed up for. */
export function welcomeEmail(guideSlug?: string | null) {
  const guide = guideSlug ? freeGuides[guideSlug] : undefined;
  const link = guide ? `${SITE_URL}${freeGuidePath(guide.slug)}` : `${SITE_URL}/articles`;
  const subject = guide ? `Your free guide: ${guide.title}` : "Welcome to Lifestyle Medicine Gateway";
  const html = `
  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; border: 1px solid #eee; border-radius: 10px;">
    <h1 style="color: #10b981; font-size: 22px;">${guide ? escapeHtml(guide.title) : "Welcome"}</h1>
    <p>Thanks for joining Lifestyle Medicine Gateway.</p>
    <p>${guide ? escapeHtml(guide.summary) : "We share practical, evidence-aware ideas for everyday wellbeing, plus new products from Australian wellness brands."}</p>
    <p style="margin: 24px 0;">
      <a href="${link}" style="display: inline-block; background: #10b981; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">${guide ? "Read your guide" : "Explore our articles"}</a>
    </p>
    <p style="font-size: 12px; color: #64748b;">You're receiving this because you signed up at lifestylemedicinegateway.com. Reply to this email to unsubscribe.</p>
  </div>`;
  return { subject, html, link };
}

