const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1024 });
  
  try {
    await page.goto('https://www.lifestylemedicinegateway.com/services/hair-cutting-3', { waitUntil: 'networkidle0', timeout: 30000 });
    const html = await page.evaluate(() => document.body.innerHTML);
    const hasHeader = html.includes('Schedule Your Appointment');
    const hasCalendar = html.includes('Select Appointment');
    const hasNoSlots = html.includes('No Open Slots');
    
    console.log('Has "Schedule Your Appointment":', hasHeader);
    console.log('Has "Select Appointment":', hasCalendar);
    console.log('Has "No Open Slots":', hasNoSlots);
    
    // Also check product type string in page
    console.log('Includes product type service:', html.includes('service'));
  } catch (e) {
    console.error('Error during navigation:', e);
  } finally {
    await browser.close();
  }
})();
