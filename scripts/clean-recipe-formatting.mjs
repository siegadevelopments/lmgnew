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

function cleanRecipeContent(str) {
  if (!str) return str;

  let clean = str.trim();

  // Strip markdown code blocks
  clean = clean.replace(/^```(json|html)?\s*/i, "").replace(/\s*```$/, "").trim();

  // Handle case where raw JSON or pseudo-JSON was stored as the content
  if (clean.startsWith("{") || clean.includes('"content"')) {
    try {
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      const toParse = jsonMatch ? jsonMatch[0] : clean;
      const parsed = JSON.parse(toParse);
      if (parsed.content) {
        clean = parsed.content;
      }
    } catch (_) {
      const contentMatch = clean.match(/"content"\s*:\s*"([\s\S]*?)"\s*(?:,\s*"(?:prep_time|cook_time|instructions)"|\})/i);
      if (contentMatch && contentMatch[1]) {
        clean = contentMatch[1];
      } else {
        const contentMatchSimple = clean.match(/"content"\s*:\s*"([\s\S]*?)"/i);
        if (contentMatchSimple && contentMatchSimple[1]) {
          clean = contentMatchSimple[1];
        }
      }
    }
  }

  // Replace escaped \n and raw literal newlines
  clean = clean.replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\n/g, '\n');
  
  // Collapse whitespace between HTML tags
  clean = clean.replace(/\n+/g, " ").replace(/\s{2,}/g, " ").trim();

  return clean;
}

async function main() {
  console.log("Fetching recipes from database...");

  const { data: recipes, error: fetchError } = await supabase
    .from("recipes")
    .select("id, title, content");

  if (fetchError) {
    console.error("Error fetching recipes:", fetchError);
    return;
  }

  console.log(`Fetched ${recipes.length} recipes.`);
  let updatedCount = 0;

  for (const recipe of recipes) {
    if (!recipe.content) continue;

    const cleaned = cleanRecipeContent(recipe.content);

    if (cleaned !== recipe.content) {
      console.log(`Cleaning recipe [${recipe.id}]: "${recipe.title}"`);
      const { error: updateError } = await supabase
        .from("recipes")
        .update({ content: cleaned })
        .eq("id", recipe.id);

      if (updateError) {
        console.error(`Failed to update "${recipe.title}":`, updateError);
      } else {
        updatedCount++;
      }
    }
  }

  console.log(`Cleanup complete! Updated ${updatedCount} recipes out of ${recipes.length}.`);
}

main().catch(console.error);
