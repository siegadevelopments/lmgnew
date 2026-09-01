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
      margin: 0, // Zero margin to prevent automatic PDFKit page overflows
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
    const addHeader = () => {
      doc.save();
      doc.fontSize(8).fillColor(TEXT_MUTED).text('LIFESTYLE MEDICINE GATEWAY', 40, 25);
      doc.fontSize(8).fillColor(TEAL_MAIN).text('HEALTHY AGEING STARTER KIT', 350, 25, { align: 'right', width: 205 });
      doc.moveTo(40, 36).lineTo(555, 36).strokeColor('#e5e7eb').lineWidth(0.75).stroke();
      doc.restore();
    };

    const addFooter = (pageNum, totalPages = 5) => {
      doc.save();
      doc.moveTo(40, 800).lineTo(555, 800).strokeColor('#e5e7eb').lineWidth(0.75).stroke();
      doc.fontSize(8).fillColor(TEXT_MUTED).text('© Lifestyle Medicine Gateway | lifestylemedicinegateway.com', 40, 808);
      doc.fontSize(8).fillColor(TEXT_MUTED).text(`Page ${pageNum} of ${totalPages}`, 350, 808, { align: 'right', width: 205 });
      doc.restore();
    };

    // ==========================================
    // PAGE 1: COVER PAGE
    // ==========================================
    doc.rect(0, 0, 595, 842).fill(SAGE_BG);

    // Decorative Top Banner
    doc.rect(0, 0, 595, 210).fill(TEAL_DARK);
    doc.rect(0, 210, 595, 5).fill(GOLD);

    // Title on Top Banner
    doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold').text('OFFICIAL EVIDENCE-BASED GUIDE', 50, 50, { characterSpacing: 1.5 });
    doc.fillColor('#ffffff').fontSize(30).font('Helvetica-Bold').text('HEALTHY AGEING', 50, 75);
    doc.fillColor('#ffffff').fontSize(30).font('Helvetica-Bold').text('STARTER KIT', 50, 110);
    doc.fillColor(TEAL_LIGHT).fontSize(12).font('Helvetica').text('Practical Strategies for Energy, Sleep, Mobility & Longevity', 50, 155);

    // Main Card Body
    doc.roundedRect(40, 240, 515, 540, 10).fill('#ffffff').strokeColor('#e2e8f0').lineWidth(1).stroke();

    // Welcome Callout Box inside Card
    doc.roundedRect(65, 265, 465, 105, 8).fill(SAGE_BG);
    doc.fillColor(TEAL_DARK).fontSize(15).font('Helvetica-Bold').text('Welcome to Your Healthy Ageing Journey', 85, 282);
    doc.fillColor(TEXT_DARK).fontSize(9.5).font('Helvetica').text(
      'Ageing vibrant is not about luck—it is about daily choices. This Starter Kit brings together the science of Lifestyle Medicine to help you protect your brain, optimize energy, manage stress, and nourish your body naturally.',
      85, 305, { width: 425, lineGap: 3 }
    );

    // Key Highlights Grid
    doc.fillColor(TEAL_DARK).fontSize(13).font('Helvetica-Bold').text('What You Will Discover Inside:', 65, 395);

    const coverHighlights = [
      { title: 'The 6 Pillars of Lifestyle Medicine', desc: 'The clinical foundation for preventing and managing chronic disease.' },
      { title: 'Anti-Inflammatory Nutrition & Gut Health', desc: 'Superfoods and daily choices to support cellular vitality.' },
      { title: 'Restorative Sleep & Stress Protocols', desc: 'Proven methods to lower cortisol and sleep deeply.' },
      { title: 'Australian Native Botanical Science', desc: 'Powerful natural antioxidants for radiant pro-aging skin.' },
      { title: 'Printable 7-Day Habit Tracker', desc: 'Actionable daily checklist to turn science into lasting routine.' },
    ];

    let highlightY = 422;
    coverHighlights.forEach((item) => {
      doc.circle(75, highlightY + 5, 3.5).fill(TEAL_MAIN);
      doc.fillColor(TEXT_DARK).fontSize(10.5).font('Helvetica-Bold').text(item.title, 90, highlightY);
      doc.fillColor(TEXT_MUTED).fontSize(9).font('Helvetica').text(item.desc, 90, highlightY + 13, { width: 420 });
      highlightY += 40;
    });

    // Footer info on cover
    doc.moveTo(65, 710).lineTo(530, 710).strokeColor('#e2e8f0').lineWidth(0.75).stroke();
    doc.fillColor(TEAL_DARK).fontSize(11).font('Helvetica-Bold').text('Lifestyle Medicine Gateway', 65, 725, { width: 465, align: 'center' });
    doc.fillColor(TEXT_MUTED).fontSize(8.5).font('Helvetica').text('Evidence-based health education, natural remedies & trusted marketplace', 65, 740, { width: 465, align: 'center' });


    // ==========================================
    // PAGE 2: THE 6 PILLARS OF LIFESTYLE MEDICINE
    // ==========================================
    doc.addPage();
    addHeader();
    addFooter(2);

    doc.fillColor(TEAL_DARK).fontSize(18).font('Helvetica-Bold').text('The 6 Pillars of Lifestyle Medicine', 40, 50);
    doc.fillColor(TEXT_MUTED).fontSize(9.5).font('Helvetica').text('Lifestyle medicine is a medical specialty that uses therapeutic lifestyle interventions as a primary modality to treat chronic conditions and promote long-term vitality.', 40, 75, { width: 515, lineGap: 3 });

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

    let pillarY = 120;
    pillars.forEach((p) => {
      doc.roundedRect(40, pillarY, 515, 96, 6).fill('#f8fafc').strokeColor('#e2e8f0').lineWidth(0.75).stroke();
      doc.roundedRect(52, pillarY + 12, 32, 32, 5).fill(TEAL_MAIN);
      doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold').text(p.num, 52, pillarY + 20, { width: 32, align: 'center' });
      doc.fillColor(TEAL_DARK).fontSize(11.5).font('Helvetica-Bold').text(p.title, 96, pillarY + 14);
      doc.fillColor(TEXT_DARK).fontSize(9).font('Helvetica').text(p.body, 96, pillarY + 32, { width: 445, lineGap: 2.5 });
      pillarY += 108;
    });


    // ==========================================
    // PAGE 3: NUTRITION & GUT HEALTH STRATEGY
    // ==========================================
    doc.addPage();
    addHeader();
    addFooter(3);

    doc.fillColor(TEAL_DARK).fontSize(18).font('Helvetica-Bold').text('Anti-Inflammatory Nutrition & Gut Health', 40, 50);
    doc.fillColor(TEXT_MUTED).fontSize(9.5).font('Helvetica').text('Over 70% of your immune system resides in your gut. Supporting your gut microbiome is one of the most effective ways to slow cellular ageing and maintain high daily energy.', 40, 75, { width: 515, lineGap: 3 });

    // Section 1: Key Principles Box
    doc.roundedRect(40, 115, 515, 135, 6).fill(SAGE_BG).strokeColor('#dcfce7').lineWidth(1).stroke();
    doc.fillColor(TEAL_DARK).fontSize(12).font('Helvetica-Bold').text('Core Anti-Inflammatory Dietary Rules:', 55, 128);

    const rules = [
      'Diversify Your Plants: Aim for 30+ different plant foods per week (vegetables, fruits, herbs, nuts, seeds).',
      'Embrace Native Antioxidants: Incorporate superfruits like Kakadu Plum, rich in natural Vitamin C.',
      'Prioritize Soluble & Insoluble Fiber: Oats, legumes, chia seeds, and leafy greens feed beneficial gut microbes.',
      'Healthy Fats over Processed Oils: Cold-pressed olive oil, avocados, and macadamia oils protect cell membranes.'
    ];

    let ruleY = 152;
    rules.forEach((rule) => {
      doc.circle(63, ruleY + 4, 2.5).fill(TEAL_MAIN);
      doc.fillColor(TEXT_DARK).fontSize(9).font('Helvetica').text(rule, 72, ruleY, { width: 468 });
      ruleY += 23;
    });

    // Section 2: Recommended Superfoods Table
    doc.fillColor(TEAL_DARK).fontSize(13).font('Helvetica-Bold').text('Top Ageing-Well Foods & Their Science-Backed Benefits', 40, 272);

    const superfoods = [
      { food: 'Kakadu Plum', benefit: 'Highest natural Vitamin C on Earth. Fights oxidative stress and boosts collagen synthesis.' },
      { food: 'Leafy Greens (Spinach, Kale)', benefit: 'Rich in nitrate & folate. Supports healthy endothelial function & blood flow to brain and heart.' },
      { food: 'Wild Berries & Cherries', benefit: 'High in anthocyanins. Protects brain neurons against inflammation and supports memory.' },
      { food: 'Extra Virgin Olive Oil', benefit: 'Loaded with polyphenols and oleic acid. Linked to reduced cardiovascular risk and brain longevity.' },
      { food: 'Fermented Foods (Kombucha, Sauerkraut)', benefit: 'Provides live probiotics to diversify gut flora and enhance nutrient bio-availability.' },
    ];

    let foodY = 295;
    // Table Header
    doc.roundedRect(40, foodY, 515, 22, 4).fill(TEAL_DARK);
    doc.fillColor('#ffffff').fontSize(9.5).font('Helvetica-Bold').text('Food / Ingredient', 50, foodY + 6);
    doc.fillColor('#ffffff').fontSize(9.5).font('Helvetica-Bold').text('Longevity & Health Benefit', 200, foodY + 6);
    foodY += 22;

    superfoods.forEach((item, index) => {
      const rowBg = index % 2 === 0 ? '#ffffff' : '#f8fafc';
      doc.rect(40, foodY, 515, 36).fill(rowBg);
      doc.rect(40, foodY, 515, 36).strokeColor('#f1f5f9').lineWidth(0.5).stroke();

      doc.fillColor(TEAL_MAIN).fontSize(9).font('Helvetica-Bold').text(item.food, 50, foodY + 10, { width: 140 });
      doc.fillColor(TEXT_DARK).fontSize(8.5).font('Helvetica').text(item.benefit, 200, foodY + 7, { width: 345, lineGap: 2 });
      foodY += 36;
    });

    // Section 3: Hydration & Circadian Tip
    doc.roundedRect(40, 505, 515, 95, 6).fill('#f0f9ff').strokeColor('#bae6fd').lineWidth(1).stroke();
    doc.fillColor('#0369a1').fontSize(11).font('Helvetica-Bold').text('[STRATEGY] Hydration & Circadian Rhythm Protocol', 55, 518);
    doc.fillColor(TEXT_DARK).fontSize(9).font('Helvetica').text(
      'Drink 500ml of fresh water within 15 minutes of waking to rehydrate cells after sleep. Pair this with 10-15 minutes of early morning sunlight exposure to set your master circadian clock, improving nighttime melatonin production and daytime alertness.',
      55, 538, { width: 485, lineGap: 2.5 }
    );


    // ==========================================
    // PAGE 4: DAILY HABIT TRACKER (PRINTABLE)
    // ==========================================
    doc.addPage();
    addHeader();
    addFooter(4);

    doc.fillColor(TEAL_DARK).fontSize(18).font('Helvetica-Bold').text('Printable 7-Day Healthy Ageing Tracker', 40, 50);
    doc.fillColor(TEXT_MUTED).fontSize(9.5).font('Helvetica').text('Consistency creates transformation. Print this page or use it digitally to check off your daily core lifestyle medicine habits.', 40, 75, { width: 515, lineGap: 3 });

    // Tracker Table Header
    let tableY = 110;
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Header Row
    doc.roundedRect(40, tableY, 515, 26, 4).fill(TEAL_DARK);
    doc.fillColor('#ffffff').fontSize(9.5).font('Helvetica-Bold').text('Daily Core Habit', 50, tableY + 8);
    
    days.forEach((day, idx) => {
      doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica-Bold').text(day, 290 + (idx * 36), tableY + 8, { width: 32, align: 'center' });
    });
    tableY += 26;

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
      doc.rect(40, tableY, 515, 38).fill(rowBg);
      doc.rect(40, tableY, 515, 38).strokeColor('#e2e8f0').lineWidth(0.5).stroke();

      doc.fillColor(TEAL_DARK).fontSize(9).font('Helvetica-Bold').text(habit.title, 50, tableY + 6);
      doc.fillColor(TEXT_MUTED).fontSize(8).font('Helvetica').text(habit.desc, 50, tableY + 20);

      // Checkboxes for each day
      days.forEach((_, dIdx) => {
        const boxX = 298 + (dIdx * 36);
        doc.roundedRect(boxX, tableY + 10, 15, 15, 3).strokeColor('#cbd5e1').lineWidth(1).stroke();
      });

      tableY += 38;
    });

    // Encouragement Box
    doc.roundedRect(40, tableY + 20, 515, 80, 6).fill(SAGE_BG).strokeColor('#bbf7d0').lineWidth(1).stroke();
    doc.fillColor(TEAL_DARK).fontSize(11).font('Helvetica-Bold').text('[NOTE] The 80/20 Rule for Long-Term Success', 55, tableY + 33);
    doc.fillColor(TEXT_DARK).fontSize(9).font('Helvetica').text(
      'Aim for progress, not perfection. Checking off 4-5 habits daily produces noticeable improvements in energy, mood, and sleep within 14 days. Celebrate small wins and stay consistent!',
      55, tableY + 52, { width: 485, lineGap: 2.5 }
    );


    // ==========================================
    // PAGE 5: BOTANICAL SCIENCE & RESOURCES
    // ==========================================
    doc.addPage();
    addHeader();
    addFooter(5);

    doc.fillColor(TEAL_DARK).fontSize(18).font('Helvetica-Bold').text('Botanical Science & Recommended Resources', 40, 50);
    doc.fillColor(TEXT_MUTED).fontSize(9.5).font('Helvetica').text('Nurturing your skin and body with bio-active native ingredients accelerates repair and protects against environmental stressors.', 40, 75, { width: 515, lineGap: 3 });

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

    let botY = 115;
    doc.fillColor(TEAL_DARK).fontSize(12).font('Helvetica-Bold').text('Australian Native Super-Ingredients:', 40, botY);
    botY += 18;

    botanicals.forEach((b) => {
      doc.roundedRect(40, botY, 515, 58, 6).fill('#fafafa').strokeColor('#e5e7eb').lineWidth(0.75).stroke();
      doc.fillColor(TEAL_MAIN).fontSize(10).font('Helvetica-Bold').text(b.name, 52, botY + 8);
      doc.fillColor(TEXT_DARK).fontSize(8.5).font('Helvetica').text(b.desc, 52, botY + 24, { width: 490, lineGap: 2 });
      botY += 66;
    });

    // Final CTA Box
    doc.roundedRect(40, botY + 15, 515, 210, 8).fill(TEAL_DARK);

    doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold').text('Continue Your Journey with Us', 60, botY + 35, { width: 475, align: 'center' });
    doc.fillColor(TEAL_LIGHT).fontSize(9.5).font('Helvetica').text(
      'Explore our evidence-based platform for research articles, health recipes, natural remedies, and trusted Australian botanical products.',
      70, botY + 60, { width: 455, align: 'center', lineGap: 3 }
    );

    const links = [
      '• Read Articles: lifestylemedicinegateway.com/articles',
      '• Natural Remedies: lifestylemedicinegateway.com/natural-remedies',
      '• Healthy Recipes: lifestylemedicinegateway.com/recipes',
      '• Marketplace Store: lifestylemedicinegateway.com/products'
    ];

    let linkY = botY + 110;
    links.forEach((linkText) => {
      doc.fillColor('#ffffff').fontSize(9.5).font('Helvetica-Bold').text(linkText, 80, linkY, { width: 435, align: 'center' });
      linkY += 20;
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
