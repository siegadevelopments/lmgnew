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

const SUPABASE_URL = envVars.SUPABASE_URL || envVars.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function decodeHtmlEntities(str) {
  if (!str) return str;
  return str
    .replace(/&#8211;/g, "–")
    .replace(/&#038;/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function cleanSlug(slug) {
  if (!slug) return slug;
  // First decode HTML entities
  let clean = decodeHtmlEntities(slug);
  // Convert to lowercase
  clean = clean.toLowerCase();
  // Replace special characters, punctuation, spaces, and brackets with hyphens
  clean = clean.replace(/[^a-z0-9]+/g, "-");
  // Remove leading and trailing hyphens
  clean = clean.replace(/(^-|-$)+/g, "");
  return clean;
}

async function run() {
  console.log("Fetching recipes...");
  const { data: recipes, error } = await supabase.from("recipes").select("id, title, slug");
  
  if (error) {
    console.error("Error fetching recipes:", error);
    return;
  }

  console.log(`Found ${recipes.length} recipes in total.`);
  let updatedCount = 0;

  for (const r of recipes) {
    const cleanTitle = decodeHtmlEntities(r.title);
    const cleanedSlug = cleanSlug(r.slug);

    if (cleanTitle !== r.title || cleanedSlug !== r.slug) {
      console.log(`\nUpdating Recipe ID ${r.id}:`);
      if (r.title !== cleanTitle) {
        console.log(`  Title: "${r.title}" -> "${cleanTitle}"`);
      }
      if (r.slug !== cleanedSlug) {
        console.log(`  Slug:  "${r.slug}" -> "${cleanedSlug}"`);
      }

      const { error: updateError } = await supabase
        .from("recipes")
        .update({
          title: cleanTitle,
          slug: cleanedSlug
        })
        .eq("id", r.id);

      if (updateError) {
        console.error(`  Error updating recipe ${r.id}:`, updateError);
      } else {
        updatedCount++;
      }
    }
  }

  console.log(`\nSuccessfully updated ${updatedCount} recipes.`);
}

run().catch(console.error);
