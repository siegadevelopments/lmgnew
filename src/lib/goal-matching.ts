import { categoryConfig } from "@/lib/category-config";
import { guideConfig } from "@/lib/guide-config";

// Matches an article or recipe to the wellness goal (category) it's about, so the page can point
// readers to relevant products and the buying guide: the "content → product discovery" step of
// the growth loop (marketing/social/README.md). Pure, so it is unit-tested.

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function countWord(text: string, word: string): number {
  const re = new RegExp(`\\b${escapeRe(word.toLowerCase())}\\b`, "g");
  return (text.match(re) || []).length;
}

const plain = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").toLowerCase();

// Topic terms for articles and recipes. Deliberately separate from the category *product*
// keywords: words like "rest" or "recovery" catch product names well but misfire on prose
// ("the rest of the day", "recovery from illness").
export const GOAL_TERMS: Record<string, string[]> = {
  "menopause-support": ["menopause", "perimenopause", "menopausal", "hot flush", "hot flushes", "hot flash", "hot flashes"],
  "healthy-ageing": ["ageing", "aging", "longevity", "older adults", "wrinkles", "collagen", "joint health", "mobility", "anti-ageing", "anti-aging"],
  "gut-health": ["gut", "digestion", "digestive", "microbiome", "probiotic", "probiotics", "prebiotic", "prebiotics", "bloating", "constipation", "reflux", "fibre", "fiber", "fermented"],
  "sleep-recovery": ["sleep", "sleeping", "insomnia", "melatonin", "bedtime", "sleepless"],
  "stress-management": ["stress", "stressed", "anxiety", "anxious", "cortisol", "adaptogen", "adaptogens", "ashwagandha", "burnout", "overwhelm"],
  "weight-management": ["weight loss", "weight management", "metabolism", "appetite", "body weight"],
  "heart-health": ["heart health", "cardiovascular", "blood pressure", "cholesterol", "omega-3"],
  "brain-health": ["brain", "cognitive", "cognition", "memory", "brain fog", "dementia", "nootropic", "nootropics"],
  "womens-wellness": ["women", "woman's", "women's", "female", "period", "periods", "menstrual", "pregnancy", "fertility", "postnatal", "prenatal"],
};

export const MIN_GOAL_SCORE = 4;

/**
 * The best-matching category slug, or null when nothing matches clearly. A goal named in the
 * title wins outright (body mentions only break ties between title matches); otherwise the body
 * needs at least MIN_GOAL_SCORE term hits. Only categories in `eligible` (those with products)
 * are considered.
 */
export function matchGoal(
  title: string,
  body: string,
  eligible: string[] = Object.keys(categoryConfig),
): string | null {
  const t = plain(title || "");
  const b = plain(body || "").slice(0, 20000);
  const scored = eligible
    .filter((slug) => GOAL_TERMS[slug] && categoryConfig[slug])
    .map((slug) => ({
      slug,
      inTitle: GOAL_TERMS[slug].reduce((n, term) => n + countWord(t, term), 0),
      inBody: GOAL_TERMS[slug].reduce((n, term) => n + countWord(b, term), 0),
    }));
  const byTitle = scored.filter((x) => x.inTitle > 0);
  if (byTitle.length > 0) {
    byTitle.sort((a, b2) => b2.inTitle - a.inTitle || b2.inBody - a.inBody);
    return byTitle[0].slug;
  }
  scored.sort((a, b2) => b2.inBody - a.inBody);
  return scored[0] && scored[0].inBody >= MIN_GOAL_SCORE ? scored[0].slug : null;
}

/** The buying guide for a category, if there is one. */
export function guideForCategory(slug: string): { slug: string; title: string } | null {
  const entry = Object.entries(guideConfig).find(([, g]) => g.categorySlug === slug);
  return entry ? { slug: entry[0], title: entry[1].title } : null;
}
