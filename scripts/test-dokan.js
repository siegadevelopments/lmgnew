async function run() {
  const res = await fetch('https://lifestylemedicinegateway.com/wp-json/dokan/v1/stores?per_page=100');
  const stores = await res.json();
  console.log('Total stores:', stores.length);
  for (const store of stores.slice(0, 3)) {
    const pRes = await fetch(`https://lifestylemedicinegateway.com/wp-json/dokan/v1/stores/${store.id}/products?per_page=100`);
    const prods = await pRes.json();
    console.log(`Store ${store.id} (${store.store_name}) has ${prods.length} products`);
  }
}
run().catch(console.error);
