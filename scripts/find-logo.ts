const https = require('https');
https.get('https://lifestylemedicinegateway.com', (res: any) => {
  let data = '';
  res.on('data', (chunk: any) => data += chunk);
  res.on('end', () => {
    const match = data.match(/<img[^>]+class="custom-logo"[^>]*src="([^"]+)"/);
    if (match) console.log(match[1]);
  });
});
