import { readFileSync } from "fs";
import { join } from "path";

const MARKETING_SOCIAL_DIR = join(process.cwd(), "marketing", "social");

// Core LMG marketing/social/*.md files (matches the "SOURCE OF TRUTH" reading
// order in marketing/social/marketing-agent.md) used to ground AI-generated
// social content in the actual, current strategy docs.
const CORE_STRATEGY_FILES = [
  "social-strategy.md",
  "audience.md",
  "brand-voice.md",
  "content-pillars.md",
  "platform-strategy.md",
  "content-frameworks.md",
  "hooks.md",
  "cta-library.md",
  "hashtag-strategy.md",
];

const FALLBACK_CONTEXT = `Lifestyle Medicine Gateway (LMG) is an Australian lifestyle medicine, wellness education, community and marketplace platform. Write in a warm, knowledgeable, approachable voice using Australian English. Avoid unsupported health claims, clickbait, and generic AI-sounding content.`;

function readMarketingFile(filename: string): string | null {
  try {
    return readFileSync(join(MARKETING_SOCIAL_DIR, filename), "utf-8").trim();
  } catch (err) {
    console.error(`[marketing-context] Could not read marketing/social/${filename}:`, err);
    return null;
  }
}

/**
 * Reads LMG's marketing/social/*.md strategy docs fresh from disk on every call.
 * These files are the project's source of truth for social content (see
 * marketing/social/marketing-agent.md), so editing them changes what the admin
 * Marketing tab's AI generation produces on its next run — no code change needed.
 */
export function getMarketingContext(): string {
  const sections = CORE_STRATEGY_FILES.map((filename) => {
    const content = readMarketingFile(filename);
    return content ? `### ${filename}\n\n${content}` : null;
  }).filter((section): section is string => Boolean(section));

  if (sections.length === 0) return FALLBACK_CONTEXT;

  return sections.join("\n\n---\n\n");
}
