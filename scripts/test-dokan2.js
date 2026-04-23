async function run() {
  const res = await fetch('https://lifestylemedicinegateway.com/wp-json/dokan/v1/stores?per_page=100');
  const stores = await res.json();
  let total = 0;
  for (const store of stores) {
    let p = 1, tP = 1;
    do {
      const url = `https://lifestylemedicinegateway.com/wp-json/dokan/v1/stores/${store.id}/products?per_page=100&page=${p}`;
      const pRes = await fetch(url);
      tP = parseInt(pRes.headers.get('x-wp-totalpages')||'1',10);
      const prods = await pRes.json();
      if (prods && Array.isArray(prods)) {
        total += prods.length;
      }
      p++;
    } while(p<=tP);
  }
  console.log('Total products from Dokan stores:', total);
}
run().catch(console.error);
