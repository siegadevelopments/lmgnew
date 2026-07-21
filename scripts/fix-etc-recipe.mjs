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

async function fixPlaceholderEtc() {
  // Replace recipe 7266 content with complete instructions
  const fullGreenPeaCurryContent = `<h2>Green Pea Curry</h2><p>A vibrant, protein-packed curry that combines sweet green peas with a fragrant blend of spices, perfect for a wholesome meal.</p><h3>Ingredients</h3><ul><li>4 cups fresh or frozen green peas</li><li>1 medium onion, finely chopped</li><li>2 garlic cloves, minced</li><li>1 inch piece fresh ginger, minced</li><li>1 can (14 oz) coconut milk</li><li>1 cup vegetable broth</li><li>1 tbsp curry powder</li><li>1 tsp ground cumin</li><li>1 tsp ground coriander</li><li>1/2 tsp turmeric</li><li>1/4 tsp cayenne pepper</li><li>1 tbsp coconut oil</li><li>Salt and pepper to taste</li><li>Fresh cilantro, chopped (for garnish)</li></ul><h3>Instructions</h3><ol><li>Heat coconut oil in a large skillet over medium heat. Add onion, garlic, and ginger; cook until soft and fragrant (about 5 minutes).</li><li>Stir in curry powder, cumin, coriander, turmeric, and cayenne. Cook for 1 minute until fragrant.</li><li>Pour in coconut milk and vegetable broth, bringing the mixture to a gentle simmer.</li><li>Add the green peas and simmer for 10 minutes until tender and sauce thickens slightly.</li><li>Season with salt and pepper to taste. Garnish with fresh cilantro and serve warm.</li></ol><p><em>Health Tip: Including green peas boosts fiber and plant‑based protein, supporting digestion and satiety.</em></p>`;

  const { error } = await supabase
    .from("recipes")
    .update({ content: fullGreenPeaCurryContent })
    .eq("id", 7266);

  if (error) {
    console.error("Error updating recipe:", error);
  } else {
    console.log("Successfully updated Green Pea Curry (7266) with complete step-by-step instructions!");
  }
}

fixPlaceholderEtc();
