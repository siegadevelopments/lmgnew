import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

function createHealthyAgingPDF(outputPath) {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      info: {
        Title: 'Healthy Ageing Starter Kit',
        Author: 'Lifestyle Medicine Gateway',
        Subject: 'Evidence-Based Guide to Longevity and Wellbeing',
        Keywords: 'healthy aging, lifestyle medicine, nutrition, sleep, natural remedies',
      }
    });

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Color Palette
    const TEAL_DARK = '#134e4a';   // teal-900
    const TEAL_MAIN = '#0f766e';   // teal-700
    const TEAL_LIGHT = '#ccfbf1';  // teal-100
    const SAGE_BG = '#f0fdf4';     // green-50 / sage
    const TEXT_DARK = '#1f2937';   // gray-800
    const TEXT_MUTED = '#4b5563';  // gray-600
    const GOLD = '#d97706';        // amber-600

    // Helper Functions
    const addHeader = (pageNum) => {
      if (pageNum === 1) return; // Skip cover
      doc.save();
      doc.fontSize(8).fillColor(TEXT_MUTED).text('LIFESTYLE MEDICINE GATEWAY', 40, 25);
      doc.fontSize(8).fillColor(TEAL_MAIN).text('HEALTHY AGEING STARTER KIT', 350, 25, { align: 'right' });
      doc.moveTo(40, 36).lineTo(555, 36).strokeColor('#e5e7eb').lineWidth(0.75).stroke();
      doc.restore();
    };

    const addFooter = (pageNum, totalPages = 5) => {
      if (pageNum === 1) return; // Skip cover
      doc.save();
      doc.moveTo(40, 800).lineTo(555, 800).strokeColor('#e5e7eb').lineWidth(0.75).stroke();
      doc.fontSize(8).fillColor(TEXT_MUTED).text('© Lifestyle Medicine Gateway | lifestylemedicinegateway.com', 40, 808);
      doc.fontSize(8).fillColor(TEXT_MUTED).text(`Page ${pageNum} of ${totalPages}`, 350, 808, { align: 'right' });
      doc.restore();
    };

    // ==========================================
    // PAGE 1: COVER PAGE
    // ==========================================
    doc.rect(0, 0, 595, 842).fill(SAGE_BG);

    // Decorative Top Banner
    doc.rect(0, 0, 595, 220).fill(TEAL_DARK);

    // Accent line
    doc.rect(0, 220, 595, 6).fill(GOLD);

    // Title on Top Banner
    doc.fillColor('#ffffff').fontSize(12).text('OFFICIAL EVIDENCE-BASED GUIDE', 50, 55, { characterSpacing: 2 });
    doc.fillColor('#ffffff').fontSize(32).font('Helvetica-Bold').text('HEALTHY AGEING\nSTARTER KIT', 50, 80, { leading: 6 });
    doc.fillColor(TEAL_LIGHT).fontSize(13).font('Helvetica').text('Practical Strategies for Energy, Sleep, Mobility & Longevity', 50, 160);

    // Main Card Body
    doc.roundedRect(40, 260, 515, 520, 12).fill('#ffffff').strokeColor('#e2e8f0').lineWidth(1).stroke();

    // Welcome Callout Box inside Card
    doc.roundedRect(65, 290, 465, 110, 8).fill(SAGE_BG);
    doc.fillColor(TEAL_DARK).fontSize(16).font('Helvetica-Bold').text('Welcome to Your Healthy Ageing Journey', 85, 310);
    doc.fillColor(TEXT_DARK).fontSize(10).font('Helvetica').text(
      'Ageing vibrant is not about luck—it is about daily choices. This Starter Kit brings together the science of Lifestyle Medicine to help you protect your brain, optimize energy, manage stress, and nourish your body naturally.',
      85, 335, { width: 425, lineGap: 4 }
    );

    // Key Highlights Grid
    doc.fillColor(TEAL_DARK).fontSize(14).font('Helvetica-Bold').text('What You Will Discover Inside:', 65, 430);

    const coverHighlights = [
      { title: 'The 6 Pillars of Lifestyle Medicine', desc: 'The clinical foundation for preventing and managing chronic disease.' },
      { title: 'Anti-Inflammatory Nutrition & Gut Health', desc: 'Superfoods and daily choices to support cellular vitality.' },
      { title: 'Restorative Sleep & Stress Protocols', desc: 'Proven methods to lower cortisol and sleep deeply.' },
      { title: 'Australian Native Botanical Science', desc: 'Powerful natural antioxidants for radiant pro-aging skin.' },
      { title: 'Printable 7-Day Habit Tracker', desc: 'Actionable daily checklist to turn science into lasting routine.' },
    ];

    let highlightY = 460;
    coverHighlights.forEach((item, index) => {
      doc.circle(75, highlightY + 6, 4).fill(TEAL_MAIN);
      doc.fillColor(TEXT_DARK).fontSize(11).font('Helvetica-Bold').text(item.title, 90, highlightY);
      doc.fillColor(TEXT_MUTED).fontSize(9.5).font('Helvetica').text(item.desc, 90, highlightY + 14, { width: 420 });
      highlightY += 44;
    });

    // Footer info on cover
    doc.moveTo(65, 715).lineTo(530, 715).strokeColor('#e2e8f0').lineWidth(1).stroke();
    doc.fillColor(TEAL_DARK).fontSize(11).font('Helvetica-Bold').text('Lifestyle Medicine Gateway', 65, 730, { align: 'center' });
    doc.fillColor(TEXT_MUTED).fontSize(9).font('Helvetica').text('Evidence-based health education, natural remedies & trusted marketplace', 65, 746, { align: 'center' });


    // ==========================================
    // PAGE 2: THE 6 PILLARS OF LIFESTYLE MEDICINE
    // ==========================================
    doc.addPage();
    addHeader(2);
    addFooter(2);

    doc.fillColor(TEAL_DARK).fontSize(20).font('Helvetica-Bold').text('The 6 Pillars of Lifestyle Medicine', 40, 55);
    doc.fillColor(TEXT_MUTED).fontSize(10).font('Helvetica').text('Lifestyle medicine is a medical specialty that uses therapeutic lifestyle interventions as a primary modality to treat chronic conditions and promote long-term vitality.', 40, 82, { width: 515, lineGap: 3 });

    const pillars = [
      {
        num: '1',
        title: 'Whole-Food Nutrition',
        body: 'Emphasize whole, plant-predominant foods rich in fiber, antioxidants, and phytonutrients. Reducing ultra-processed foods lowers systemic inflammation and protects cellular health.'
      },
      {
        num: '2',
        title: 'Physical Activity',
        body: 'Regular movement preserves muscle mass (sarcopenia prevention), supports bone density, and enhances cardiovascular and cognitive longevity. Aim for 150 minutes of moderate activity weekly.'
      },
      {
        num: '3',
        title: 'Restorative Sleep',
        body: 'Quality sleep (7-9 hours) is when the brain clears metabolic waste via the glymphatic system. Consistent sleep hygiene optimizes immune function and daytime energy.'
      },
      {
        num: '4',
        title: 'Stress Management',
        body: 'Chronic stress elevates cortisol and accelerates cellular ageing. Mindfulness, deep breathing, and nature exposure help shift the nervous system into rest-and-digest mode.'
      },
      {
        num: '5',
        title: 'Social Connection',
        body: 'Strong social bonds and community connection are scientifically linked to lower risk of cognitive decline, depression, and premature mortality. Connection is vital medicine.'
      },
      {
        num: '6',
        title: 'Environmental Wellness',
        body: 'Minimize exposure to environmental toxins, tobacco, and excessive alcohol while surrounding yourself with clean water, clean household products, and natural remedies.'
      }
    ];

    let pillarY = 135;
    pillars.forEach((p) => {
      // Card background
      doc.roundedRect(40, pillarY, 515, 92, 8).fill('#f8fafc').strokeColor('#e2e8f0').lineWidth(1).stroke();
      
      // Number badge
      doc.roundedRect(52, pillarY + 12, 32, 32, 6).fill(TEAL_MAIN);
      doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold').text(p.num, 52, pillarY + 20, { width: 32, align: 'center' });

      // Content
      doc.fillColor(TEAL_DARK).fontSize(12).font('Helvetica-Bold').text(p.title, 96, pillarY + 14);
      doc.fillColor(TEXT_DARK).fontSize(9.5).font('Helvetica').text(p.body, 96, pillarY + 32, { width: 445, lineGap: 3 });

      pillarY += 104;
    });


    // ==========================================
    // PAGE 3: NUTRITION & GUT HEALTH STRATEGY
    // ==========================================
    doc.addPage();
    addHeader(3);
    addFooter(3);

    doc.fillColor(TEAL_DARK).fontSize(20).font('Helvetica-Bold').text('Anti-Inflammatory Nutrition & Gut Health', 40, 55);
    doc.fillColor(TEXT_MUTED).fontSize(10).font('Helvetica').text('Over 70% of your immune system resides in your gut. Supporting your gut microbiome is one of the most effective ways to slow cellular ageing and maintain high daily energy.', 40, 82, { width: 515, lineGap: 3 });

    // Section 1: Key Principles Box
    doc.roundedRect(40, 130, 515, 140, 8).fill(SAGE_BG).strokeColor('#dcfce7').lineWidth(1).stroke();
    doc.fillColor(TEAL_DARK).fontSize(13).font('Helvetica-Bold').text('Core Anti-Inflammatory Dietary Rules:', 55, 145);

    const rules = [
      'Diversify Your Plants: Aim for 30+ different plant foods per week (vegetables, fruits, herbs, nuts, seeds).',
      'Embrace Native Antioxidants: Incorporate superfruits like Kakadu Plum, rich in natural Vitamin C.',
      'Prioritize Soluble & Insoluble Fiber: Oats, legumes, chia seeds, and leafy greens feed beneficial gut microbes.',
      'Healthy Fats over Processed Oils: Cold-pressed olive oil, avocados, and macadamia oils protect cell membranes.'
    ];

    let ruleY = 170;
    rules.forEach((rule) => {
      doc.circle(63, ruleY + 4, 3).fill(TEAL_MAIN);
      doc.fillColor(TEXT_DARK).fontSize(9.5).font('Helvetica').text(rule, 73, ruleY, { width: 465 });
      ruleY += 24;
    });

    // Section 2: Recommended Superfoods Table
    doc.fillColor(TEAL_DARK).fontSize(14).font('Helvetica-Bold').text('Top Ageing-Well Foods & Their Science-Backed Benefits', 40, 295);

    const superfoods = [
      { food: 'Kakadu Plum', benefit: 'Highest natural Vitamin C on Earth. Fights oxidative stress and boosts collagen synthesis.' },
      { food: 'Leafy Greens (Spinach, Kale)', benefit: 'Rich in nitrate & folate. Supports healthy endothelial function & blood flow to brain and heart.' },
      { food: 'Wild Berries & Cherries', benefit: 'High in anthocyanins. Protects brain neurons against inflammation and supports memory.' },
      { food: 'Extra Virgin Olive Oil', benefit: 'Loaded with polyphenols and oleic acid. Linked to reduced cardiovascular risk and brain longevity.' },
      { food: 'Fermented Foods (Kombucha, Sauerkraut)', benefit: 'Provides live probiotics to diversify gut flora and enhance nutrient bio-availability.' },
    ];

    let foodY = 325;
    // Table Header
    doc.roundedRect(40, foodY, 515, 24, 4).fill(TEAL_DARK);
    doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold').text('Food / Ingredient', 50, foodY + 7);
    doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold').text('Longevity & Health Benefit', 200, foodY + 7);
    foodY += 24;

    superfoods.forEach((item, index) => {
      const rowBg = index % 2 === 0 ? '#ffffff' : '#f8fafc';
      doc.rect(40, foodY, 515, 38).fill(rowBg);
      doc.rect(40, foodY, 515, 38).strokeColor('#f1f5f9').lineWidth(0.5).stroke();

      doc.fillColor(TEAL_MAIN).fontSize(9.5).font('Helvetica-Bold').text(item.food, 50, foodY + 12, { width: 140 });
      doc.fillColor(TEXT_DARK).fontSize(9).font('Helvetica').text(item.benefit, 200, foodY + 8, { width: 345, lineGap: 2 });
      foodY += 38;
    });

    // Section 3: Hydration & Circadian Tip
    doc.roundedRect(40, 545, 515, 110, 8).fill('#f0f9ff').strokeColor('#bae6fd').lineWidth(1).stroke();
    doc.fillColor('#0369a1').fontSize(12).font('Helvetica-Bold').text('💡 Hydration & Circadian Rhythm Strategy', 55, 560);
    doc.fillColor(TEXT_DARK).fontSize(9.5).font('Helvetica').text(
      'Drink 500ml of fresh water within 15 minutes of waking to rehydrate cells after sleep. Pair this with 10-15 minutes of early morning sunlight exposure to set your master circadian clock, improving nighttime melatonin production and daytime alertness.',
      55, 582, { width: 485, lineGap: 3 }
    );


    // ==========================================
    // PAGE 4: DAILY HABIT TRACKER (PRINTABLE)
    // ==========================================
    doc.addPage();
    addHeader(4);
    addFooter(4);

    doc.fillColor(TEAL_DARK).fontSize(20).font('Helvetica-Bold').text('Printable 7-Day Healthy Ageing Tracker', 40, 55);
    doc.fillColor(TEXT_MUTED).fontSize(10).font('Helvetica').text('Consistency creates transformation. Print this page or use it digitally to check off your daily core lifestyle medicine habits.', 40, 82, { width: 515, lineGap: 3 });

    // Tracker Table Header
    let tableY = 120;
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Header Row
    doc.roundedRect(40, tableY, 515, 30, 6).fill(TEAL_DARK);
    doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold').text('Daily Core Habit', 50, tableY + 10);
    
    days.forEach((day, idx) => {
      doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold').text(day, 290 + (idx * 36), tableY + 10, { width: 32, align: 'center' });
    });
    tableY += 30;

    const habits = [
      { title: 'Morning Sunlight & Water', desc: '500ml water + 10m outdoor light' },
      { title: '30+ Minutes Movement', desc: 'Walking, strength, or flexibility' },
      { title: 'Anti-Inflammatory Meal', desc: 'Whole plant foods & healthy fats' },
      { title: '2L Total Hydration', desc: 'Consistent water throughout day' },
      { title: '10m Mindful Stress Relief', desc: 'Deep breathing or nature walk' },
      { title: 'Social / Heart Connection', desc: 'Call or conversation with loved one' },
      { title: 'Nighttime Sleep Routine', desc: 'Screens off 1 hr before bed' },
      { title: 'Pro-Aging Botanical Care', desc: 'Clean skincare / natural remedy' },
    ];

    habits.forEach((habit, idx) => {
      const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      doc.rect(40, tableY, 515, 42).fill(rowBg);
      doc.rect(40, tableY, 515, 42).strokeColor('#e2e8f0').lineWidth(0.5).stroke();

      doc.fillColor(TEAL_DARK).fontSize(9.5).font('Helvetica-Bold').text(habit.title, 50, tableY + 8);
      doc.fillColor(TEXT_MUTED).fontSize(8.5).font('Helvetica').text(habit.desc, 50, tableY + 23);

      // Checkboxes for each day
      days.forEach((_, dIdx) => {
        const boxX = 298 + (dIdx * 36);
        doc.roundedRect(boxX, tableY + 12, 16, 16, 3).strokeColor('#cbd5e1').lineWidth(1.2).stroke();
      });

      tableY += 42;
    });

    // Encouragement Box
    doc.roundedRect(40, tableY + 25, 515, 95, 8).fill(SAGE_BG).strokeColor('#bbf7d0').lineWidth(1).stroke();
    doc.fillColor(TEAL_DARK).fontSize(12).font('Helvetica-Bold').text('🏆 The 80/20 Rule for Long-Term Success', 55, tableY + 40);
    doc.fillColor(TEXT_DARK).fontSize(9.5).font('Helvetica').text(
      'Aim for progress, not perfection. Checking off 4-5 habits daily produces noticeable improvements in energy, mood, and sleep within 14 days. Celebrate small wins and stay consistent!',
      55, tableY + 60, { width: 485, lineGap: 3 }
    );


    // ==========================================
    // PAGE 5: BOTANICAL SCIENCE & RESOURCES
    // ==========================================
    doc.addPage();
    addHeader(5);
    addFooter(5);

    doc.fillColor(TEAL_DARK).fontSize(20).font('Helvetica-Bold').text('Botanical Science & Recommended Resources', 40, 55);
    doc.fillColor(TEXT_MUTED).fontSize(10).font('Helvetica').text('Nurturing your skin and body with bio-active native ingredients accelerates repair and protects against environmental stressors.', 40, 82, { width: 515, lineGap: 3 });

    // Section: Botanical Highlights
    const botanicals = [
      {
        name: 'Kakadu Plum (Terminalia ferdinandiana)',
        desc: 'Wild-harvested in Northern Australia. Contains up to 100x the Vitamin C of oranges. Fades pigmentation, stimulates collagen, and neutralizes free radicals.'
      },
      {
        name: 'Australian Snake Vine',
        desc: 'Rich in super-antioxidants that fortify the skin barrier, restore elastic tissue, and protect against premature photo-ageing.'
      },
      {
        name: 'Tasmanian Mountain Pepper Berry',
        desc: 'Contains potent polygodial compounds that reduce skin inflammation, soothe redness, and calm hyper-sensitive skin.'
      }
    ];

    let botY = 130;
    doc.fillColor(TEAL_DARK).fontSize(13).font('Helvetica-Bold').text('Australian Native Super-Ingredients:', 40, botY);
    botY += 20;

    botanicals.forEach((b) => {
      doc.roundedRect(40, botY, 515, 62, 6).fill('#fafafa').strokeColor('#e5e7eb').lineWidth(0.75).stroke();
      doc.fillColor(TEAL_MAIN).fontSize(10.5).font('Helvetica-Bold').text(b.name, 52, botY + 10);
      doc.fillColor(TEXT_DARK).fontSize(9).font('Helvetica').text(b.desc, 52, botY + 26, { width: 490, lineGap: 2 });
      botY += 72;
    });

    // Final CTA Box
    doc.roundedRect(40, botY + 20, 515, 230, 10).fill(TEAL_DARK);

    doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold').text('Continue Your Journey with Us', 60, botY + 45, { align: 'center' });
    doc.fillColor(TEAL_LIGHT).fontSize(10.5).font('Helvetica').text(
      'Explore our evidence-based platform for research articles, health recipes, natural remedies, and trusted Australian botanical products.',
      70, botY + 75, { width: 455, align: 'center', lineGap: 4 }
    );

    // Callout buttons text inside box
    const links = [
      '📚 Read Articles: lifestylemedicinegateway.com/articles',
      '🌿 Natural Remedies: lifestylemedicinegateway.com/natural-remedies',
      '🥗 Healthy Recipes: lifestylemedicinegateway.com/recipes',
      '🛍️ Marketplace Store: lifestylemedicinegateway.com/products'
    ];

    let linkY = botY + 125;
    links.forEach((linkText) => {
      doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold').text(linkText, 80, linkY, { align: 'center' });
      linkY += 22;
    });

    doc.end();

    stream.on('finish', () => {
      console.log(`PDF successfully created at: ${outputPath}`);
      resolve(true);
    });

    stream.on('error', (err) => {
      reject(err);
    });
  });
}

const targetPath = path.resolve(process.cwd(), 'public', 'Healthy_Ageing_Starter_Kit.pdf');
const altPath = path.resolve(process.cwd(), 'public', 'guides', 'Healthy_Ageing_Starter_Kit.pdf');

createHealthyAgingPDF(targetPath)
  .then(() => createHealthyAgingPDF(altPath))
  .catch(console.error);
