import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = envFile.split('\n').reduce((acc, line) => {
  const [key, ...value] = line.split('=');
  if (key && value) {
    acc[key.trim()] = value.join('=').trim().replace(/^"|"$/g, '');
  }
  return acc;
}, {} as any);

const supabase = createClient(env.SUPABASE_URL || env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const email = "ann@foundersformula.com.au";
  
  console.log(`Checking if user ${email} exists...`);
  const { data: usersData } = await supabase.auth.admin.listUsers();
  const user = usersData.users.find((u: any) => u.email === email);
  if (!user) {
     console.error("User not found!");
     process.exit(1);
  }
  const userId = user.id;

  console.log("Fetching products from foundersformula.com.au with currency=AUD...");
  const res = await fetch('https://foundersformula.com.au/products.json?limit=250&currency=AUD');
  const data = await res.json();
  const products = data.products;
  console.log(`Found ${products.length} products on Shopify.`);

  let successCount = 0;
  for (const p of products) {
    if (p.variants && p.variants.length > 0) {
      const price = parseFloat(p.variants[0].price);
      
      const payload = {
        price: price,
        updated_at: new Date().toISOString()
      };

      console.log(`Updating product ${p.handle} price to ${price} AUD...`);
      const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('slug', p.handle)
          .eq('vendor_id', userId);

      if (error) {
         console.error(`Failed to update ${p.title}:`, error);
      } else {
         successCount++;
      }
    }
  }

  console.log(`Successfully updated ${successCount} products!`);
}

main().catch(console.error);
