const sharp = require('sharp');
const path = require('path');

const ASSETS = path.join(__dirname, '..', 'assets');
const GREEN = '#34C759';
const BG_LIGHT = '#FFFFFF';
const BG_DARK = '#1C1C1E';

async function generateIcon() {
  const size = 1024;
  const r = size * 0.22; // icon corner radius (iOS masks it anyway)

  // Create a white background with a big green checkmark circle
  const circleR = size * 0.34;
  const cx = size / 2;
  const cy = size / 2;

  // Checkmark path coordinates (relative to circle center)
  const checkScale = circleR * 0.55;
  // Simple checkmark: two lines forming a ✓
  const x1 = cx - checkScale * 0.35;
  const y1 = cy + checkScale * 0.05;
  const x2 = cx - checkScale * 0.05;
  const y2 = cy + checkScale * 0.35;
  const x3 = cx + checkScale * 0.45;
  const y3 = cy - checkScale * 0.35;

  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FAFFFE"/>
          <stop offset="100%" stop-color="#F0FFF4"/>
        </linearGradient>
        <linearGradient id="gr" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#3BD965"/>
          <stop offset="100%" stop-color="#28A745"/>
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${r}" fill="url(#bg)"/>
      <circle cx="${cx}" cy="${cy}" r="${circleR}" fill="url(#gr)"/>
      <polyline
        points="${x1},${y1} ${x2},${y2} ${x3},${y3}"
        fill="none"
        stroke="white"
        stroke-width="${size * 0.055}"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `;

  // Main icon 1024x1024
  await sharp(Buffer.from(svg))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(ASSETS, 'icon.png'));

  console.log('✓ icon.png (1024x1024)');

  // Adaptive icon foreground (same as icon)
  await sharp(Buffer.from(svg))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(ASSETS, 'adaptive-icon.png'));

  console.log('✓ adaptive-icon.png (1024x1024)');

  // Favicon 48x48
  await sharp(Buffer.from(svg))
    .resize(48, 48)
    .png()
    .toFile(path.join(ASSETS, 'favicon.png'));

  console.log('✓ favicon.png (48x48)');
}

async function generateSplash() {
  const w = 1284;
  const h = 2778;
  const iconSize = 200;
  const cx = w / 2;
  const cy = h / 2 - 40;

  // Smaller checkmark for splash
  const circleR = iconSize * 0.4;
  const checkScale = circleR * 0.55;
  const ix = cx;
  const iy = cy;
  const x1 = ix - checkScale * 0.35;
  const y1 = iy + checkScale * 0.05;
  const x2 = ix - checkScale * 0.05;
  const y2 = iy + checkScale * 0.35;
  const x3 = ix + checkScale * 0.45;
  const y3 = iy - checkScale * 0.35;

  const svg = `
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${w}" height="${h}" fill="#F2F2F7"/>
      <circle cx="${ix}" cy="${iy}" r="${circleR}" fill="${GREEN}"/>
      <polyline
        points="${x1},${y1} ${x2},${y2} ${x3},${y3}"
        fill="none"
        stroke="white"
        stroke-width="12"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <text
        x="${cx}"
        y="${cy + circleR + 50}"
        text-anchor="middle"
        font-family="SF Pro Display, -apple-system, Helvetica, Arial, sans-serif"
        font-size="36"
        font-weight="700"
        fill="#1C1C1E"
        letter-spacing="-0.5"
      >LifeTrack</text>
    </svg>
  `;

  // Splash icon (just the centered icon portion)
  const splashIconSvg = `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="80" fill="${GREEN}"/>
      <polyline
        points="68,102 90,124 138,72"
        fill="none"
        stroke="white"
        stroke-width="14"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `;

  await sharp(Buffer.from(splashIconSvg))
    .resize(200, 200)
    .png()
    .toFile(path.join(ASSETS, 'splash-icon.png'));

  console.log('✓ splash-icon.png (200x200)');
}

(async () => {
  await generateIcon();
  await generateSplash();
  console.log('\nAll assets generated!');
})();
