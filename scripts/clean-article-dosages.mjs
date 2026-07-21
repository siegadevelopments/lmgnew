import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

const envFile = readFileSync(resolve("d:/projects/projects/lmgnew/.env.local"), "utf-8");
const envVars = {};
for (const line of envFile.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  let val = trimmed.slice(eqIdx + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  envVars[key] = val;
}

const supabase = createClient(envVars.SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

function removeDosagesFromHtml(html) {
  if (!html) return html;

  let cleaned = html;

  // Pattern 1: Remove list items or bullet lines dedicated to dosage instructions or containing mg/g dosages
  // e.g. <li><strong>Magnesium glycinate:</strong> 200–400 mg daily</li> -> <li><strong>Magnesium glycinate:</strong> Supports relaxation and neurological health</li>
  cleaned = cleaned.replace(/<li>(.*?)(\b\d+(?:-\d+)?\s*(?:mg|g|mcg|ml|tsp|tbsp|capsules?|tablets?|drops?)(?:\/[a-z]+|\s*daily|\s*per day)?)(.*?)<\/li>/gi, (match, p1, p2, p3) => {
    // Keep the item name/concept, remove the dosage number part
    let prefix = p1.trim();
    let suffix = p3.trim();
    if (suffix.startsWith('daily') || suffix.startsWith('per day')) {
      suffix = suffix.replace(/^(?:daily|per day)\s*/i, '');
    }
    return `<li>${prefix} ${suffix}</li>`.replace(/\s{2,}/g, ' ').replace(/:\s*<\/li>/, '</li>');
  });

  // Pattern 2: Remove explicit Dosage: lines or Suggested dose: paragraphs
  cleaned = cleaned.replace(/<p>\s*<strong>\s*(?:Suggested\s+dose|Typical\s+(?:adult\s+)?dosage|Common\s+dosage|Dosage):?\s*<\/strong>[\s\S]*?<\/p>/gi, '');
  cleaned = cleaned.replace(/<p>\s*(?:Typical|Common|Suggested)?\s*dosage:?[\s\S]*?<\/p>/gi, '');

  // Pattern 3: Remove inline explicit dosage numbers (e.g. "Mix 2 drops of castor oil with 2 drops of coconut oil") -> ("Mix castor oil with coconut oil")
  cleaned = cleaned.replace(/\b\d+(?:-\d+)?\s*(?:mg|g|mcg|ml|tsp|tbsp|capsules?|tablets?|drops?)\b(?:\s*daily|\s*per day)?/gi, '');

  // Collapse empty tags or consecutive spaces
  cleaned = cleaned.replace(/<li>\s*<\/li>/gi, '');
  cleaned = cleaned.replace(/\s{2,}/g, ' ');

  return cleaned;
}

async function main() {
  console.log("Fetching articles...");
  const { data: articles, error } = await supabase.from("articles").select("id, title, content");

  if (error) {
    console.error("Error fetching articles:", error);
    return;
  }

  console.log(`Fetched ${articles.length} articles.`);
  let updatedCount = 0;

  for (const article of articles) {
    if (!article.content) continue;

    const cleaned = removeDosagesFromHtml(article.content);

    if (cleaned !== article.content) {
      console.log(`Removing dosages from article [${article.id}]: "${article.title}"`);
      const { error: updateError } = await supabase
        .from("articles")
        .update({ content: cleaned })
        .eq("id", article.id);

      if (updateError) {
        console.error(`Failed to update article ${article.id}:`, updateError);
      } else {
        updatedCount++;
      }
    }
  }

  console.log(`Completed dosage cleanup! Updated ${updatedCount} articles.`);
}

main().catch(console.error);
