const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Capture console messages
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
  
  await page.setViewport({ width: 1280, height: 1024 });
  
  try {
    await page.goto('https://www.lifestylemedicinegateway.com/services/hair-cutting-3', { waitUntil: 'networkidle0', timeout: 30000 });
    await page.screenshot({ path: 'scratch/calendar_debug.png' });
    console.log('Screenshot saved to scratch/calendar_debug.png');
  } catch (e) {
    console.error('Error during navigation:', e);
  } finally {
    await browser.close();
  }
})();
