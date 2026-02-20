const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ASSETS = path.join(__dirname, '..', 'assets');
const STORE = path.join(ASSETS, 'store');
const SCREENSHOTS = path.join(ASSETS, 'screenshots');

async function createIcon512() {
  console.log('Creating 512x512 icon...');
  await sharp(path.join(ASSETS, 'icon.png'))
    .resize(512, 512)
    .png()
    .toFile(path.join(STORE, 'icon-512.png'));
  console.log('  ✓ icon-512.png');
}

async function createFeatureGraphic() {
  console.log('Creating feature graphic 1024x500...');

  const W = 1024;
  const H = 500;
  const iconSize = 140;
  const gap = 16; // space between icon and title
  const titleH = 60; // approximate title height
  const subH = 24;  // approximate subtitle height
  const subGap = 8;

  // Total content block height: icon + gap + title + subGap + subtitle
  const blockH = iconSize + gap + titleH + subGap + subH;
  const topOffset = Math.round((H - blockH) / 2);

  const iconTop = topOffset;
  const iconLeft = Math.round((W - iconSize) / 2);
  const titleY = iconTop + iconSize + gap + titleH - 10; // baseline
  const subY = titleY + subGap + subH;

  // Load and resize the icon for compositing
  const iconBuf = await sharp(path.join(ASSETS, 'icon.png'))
    .resize(iconSize, iconSize)
    .png()
    .toBuffer();

  // SVG with text "LifeTrack" and subtitle
  const textSvg = Buffer.from(`
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <text x="${W / 2}" y="${titleY}" text-anchor="middle"
            font-family="SF Pro Display, Helvetica Neue, Arial, sans-serif"
            font-size="56" font-weight="700" fill="white"
            letter-spacing="-1">LifeTrack</text>
      <text x="${W / 2}" y="${subY}" text-anchor="middle"
            font-family="SF Pro Display, Helvetica Neue, Arial, sans-serif"
            font-size="22" font-weight="400" fill="rgba(255,255,255,0.75)">Трекер привычек</text>
    </svg>
  `);

  // Create green background with icon and text
  const bgBuf = await sharp({
    create: {
      width: W,
      height: H,
      channels: 4,
      background: { r: 52, g: 199, b: 89, alpha: 1 }, // #34C759
    },
  }).png().toBuffer();

  await sharp(bgBuf)
    .composite([
      { input: iconBuf, top: iconTop, left: iconLeft },
      { input: textSvg, top: 0, left: 0 },
    ])
    .png()
    .toFile(path.join(STORE, 'feature-graphic.png'));

  console.log('  ✓ feature-graphic.png');
}

async function prepareScreenshots() {
  console.log('Preparing phone screenshots for Google Play (9:16 max ratio)...');

  const phoneDir = path.join(STORE, 'phone');
  fs.mkdirSync(phoneDir, { recursive: true });

  const files = fs.readdirSync(SCREENSHOTS)
    .filter((f) => f.endsWith('.png'))
    .sort();

  for (const file of files) {
    const src = path.join(SCREENSHOTS, file);
    const meta = await sharp(src).metadata();
    const { width, height } = meta;

    // Google Play max ratio is 9:16 (portrait) = 1:1.778
    const maxHeight = Math.floor(width * (16 / 9)); // for 1284 width → 2282

    if (height > maxHeight) {
      // Need to extend width to satisfy 9:16 ratio
      // Target width for current height: height * 9 / 16
      const targetWidth = Math.ceil(height * 9 / 16); // for 2778 → 1563
      const padTotal = targetWidth - width; // 1563 - 1284 = 279
      const padLeft = Math.floor(padTotal / 2);
      const padRight = padTotal - padLeft;

      // Detect background color from top-left pixel
      const { data } = await sharp(src)
        .extract({ left: 0, top: height - 10, width: 1, height: 1 })
        .raw()
        .toBuffer({ resolveWithObject: true });

      const bgColor = { r: data[0], g: data[1], b: data[2], alpha: 1 };

      await sharp(src)
        .extend({
          top: 0,
          bottom: 0,
          left: padLeft,
          right: padRight,
          background: bgColor,
        })
        .png()
        .toFile(path.join(phoneDir, file));

      console.log(`  ✓ ${file} — padded ${width}x${height} → ${targetWidth}x${height}`);
    } else {
      // Already fits, just copy
      await sharp(src).png().toFile(path.join(phoneDir, file));
      console.log(`  ✓ ${file} — ${width}x${height} (OK)`);
    }
  }
}

(async () => {
  try {
    await createIcon512();
    await createFeatureGraphic();
    await prepareScreenshots();
    console.log('\nDone! All assets saved to assets/store/');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
