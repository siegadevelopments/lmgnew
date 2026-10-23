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
const TITLE_WEIGHT = 10; // a goal named in the title wins over body mentions

/**
 * The best-matching category slug, or null when nothing matches clearly. Term hits in the
 * title count ten times (a goal named in the title wins); only categories in `eligible` (those with products) are considered.
 */
export function matchGoal(
  title: string,
  body: string,
  eligible: string[] = Object.keys(categoryConfig),
): string | null {
  const t = plain(title || "");
  const b = plain(body || "").slice(0, 20000);
  let best: { slug: string; score: number } | null = null;
  for (const slug of eligible) {
    const terms = GOAL_TERMS[slug];
    if (!terms || !categoryConfig[slug]) continue;
    let score = 0;
    for (const term of terms) score += TITLE_WEIGHT * countWord(t, term) + countWord(b, term);
    if (!best || score > best.score) best = { slug, score };
  }
  return best && best.score >= MIN_GOAL_SCORE ? best.slug : null;
}

/** The buying guide for a category, if there is one. */
export function guideForCategory(slug: string): { slug: string; title: string } | null {
  const entry = Object.entries(guideConfig).find(([, g]) => g.categorySlug === slug);
  return entry ? { slug: entry[0], title: entry[1].title } : null;
}
