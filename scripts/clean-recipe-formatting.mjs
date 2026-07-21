import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Parse .env.local manually
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

const SUPABASE_URL = envVars.SUPABASE_URL || envVars.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function extractCleanHtml(str) {
  if (!str) return str;

  let text = str.trim();

  // If text starts with AI role/reasoning JSON preamble like {"role":"assistant"...}
  if (text.includes('"role":"assistant"') || text.includes('"reasoning":')) {
    // Look for HTML starting tags inside the reasoning text
    const htmlStartMatch = text.match(/<(?:h[1-6]|p|div|ul|ol)\b[\s\S]*/i);
    if (htmlStartMatch) {
      text = htmlStartMatch[0];
    }
  }

  // If there is trailing AI reasoning after the HTML content (e.g., "Alternatively we could use...", "Use correct tags...")
  // Cut off at the end of the last closing HTML tag </p>, </ul>, </ol>, </div>, </h2>, <h3>, etc.
  const lastClosingTagMatch = text.match(/[\s\S]*<\/(?:p|ul|ol|div|h[1-6])>/i);
  if (lastClosingTagMatch) {
    text = lastClosingTagMatch[0];
  }

  // Remove JSON string escape sequences if any
  text = text.replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\n/g, '\n');

  // Collapse excess whitespace
  text = text.replace(/\n+/g, " ").replace(/\s{2,}/g, " ").trim();

  return text;
}

async function main() {
  console.log("Fetching recipes...");
  const { data: recipes, error } = await supabase.from("recipes").select("id, title, content");

  if (error) {
    console.error("Error fetching recipes:", error);
    return;
  }

  let updated = 0;
  for (const r of recipes) {
    if (!r.content) continue;

    const cleaned = extractCleanHtml(r.content);
    if (cleaned !== r.content) {
      console.log(`Cleaning ID ${r.id}: "${r.title}"`);
      const { error: updateError } = await supabase
        .from("recipes")
        .update({ content: cleaned })
        .eq("id", r.id);

      if (!updateError) {
        updated++;
      } else {
        console.error(`Failed to update ${r.id}:`, updateError);
      }
    }
  }

  console.log(`Finished! Updated ${updated} recipes.`);
}

main().catch(console.error);
