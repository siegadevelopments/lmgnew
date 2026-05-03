const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const input = 'public/logo.png';
const outputDir = 'public';

async function generateIcons() {
  if (!fs.existsSync(input)) {
    console.error('Input file not found:', input);
    return;
  }

  try {
    // Generate 192x192
    await sharp(input)
      .resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .toFile(path.join(outputDir, 'pwa-192x192.png'));
    console.log('Generated pwa-192x192.png');

    // Generate 512x512
    await sharp(input)
      .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .toFile(path.join(outputDir, 'pwa-512x512.png'));
    console.log('Generated pwa-512x512.png');

    // Generate apple-touch-icon
    await sharp(input)
      .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .toFile(path.join(outputDir, 'apple-touch-icon.png'));
    console.log('Generated apple-touch-icon.png');

    // Generate favicon.ico (as png for simplicity, browser handles it)
    await sharp(input)
      .resize(32, 32)
      .toFile(path.join(outputDir, 'favicon.ico'));
    console.log('Generated favicon.ico');

  } catch (err) {
    console.error('Error generating icons:', err);
  }
}

generateIcons();
