import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://usrtaxvjwidfxajbjlpj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzcnRheHZqd2lkZnhhamJqbHBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NzMxOTcsImV4cCI6MjA5MjM0OTE5N30.hP8PizGouCbfUEw6vphbrxATPs0ukX9pX3pcUoYN3qY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // 1. Get all vendors
  console.log('=== ALL VENDORS ===');
  const { data: vendors, error: vendorsError } = await supabase
    .from('vendor_profiles')
    .select('id, store_name, is_approved, is_live')
    .order('store_name');
  
  if (vendorsError) {
    console.error('Vendors error:', vendorsError);
    return;
  }
  
  console.log(`Total vendors: ${vendors.length}`);
  vendors.forEach(v => {
    console.log(`  - ${v.store_name} (id: ${v.id}, approved: ${v.is_approved}, live: ${v.is_live})`);
  });

  // 2. Get all published products grouped by vendor
  console.log('\n=== PRODUCTS BY VENDOR (published only) ===');
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, title, slug, category, product_type, status, vendor_id, vendor_profiles(store_name, is_approved, is_live)')
    .eq('status', 'published')
    .order('title');

  if (productsError) {
    console.error('Products error:', productsError);
    return;
  }

  // Group by vendor
  const byVendor = {};
  products.forEach(p => {
    const vendorName = p.vendor_profiles?.store_name || 'Unknown';
    const isApproved = p.vendor_profiles?.is_approved;
    const isLive = p.vendor_profiles?.is_live;
    if (!byVendor[vendorName]) {
      byVendor[vendorName] = { vendorId: p.vendor_id, isApproved, isLive, products: [], services: [] };
    }
    if (p.product_type === 'service') {
      byVendor[vendorName].services.push(p);
    } else {
      byVendor[vendorName].products.push(p);
    }
  });

  Object.entries(byVendor).forEach(([vendor, data]) => {
    console.log(`\n--- ${vendor} (approved: ${data.isApproved}, live: ${data.isLive}) ---`);
    if (data.products.length > 0) {
      console.log(`  Products (${data.products.length}):`);
      data.products.forEach(p => {
        console.log(`    - ${p.title} (slug: ${p.slug}, category: ${p.category})`);
      });
    }
    if (data.services.length > 0) {
      console.log(`  Services (${data.services.length}):`);
      data.services.forEach(p => {
        console.log(`    - ${p.title} (slug: ${p.slug}, category: ${p.category})`);
      });
    }
  });

  // 3. Summary of vendors with products (approved+live)
  console.log('\n=== VENDORS WITH PRODUCTS (approved & live) ===');
  const approvedVendorsWithProducts = Object.entries(byVendor)
    .filter(([_, data]) => data.isApproved && data.isLive && (data.products.length > 0 || data.services.length > 0));
  
  approvedVendorsWithProducts.forEach(([vendor, data]) => {
    console.log(`  ✅ ${vendor}: ${data.products.length} products, ${data.services.length} services`);
  });

  // 4. Vendors WITHOUT products
  console.log('\n=== VENDORS WITHOUT PUBLISHED PRODUCTS ===');
  const vendorsWithProducts = new Set(products.map(p => p.vendor_id));
  const vendorsWithoutProducts = vendors.filter(v => !vendorsWithProducts.has(v.id));
  vendorsWithoutProducts.forEach(v => {
    console.log(`  ❌ ${v.store_name} (approved: ${v.is_approved}, live: ${v.is_live})`);
  });
}

main().catch(console.error);
