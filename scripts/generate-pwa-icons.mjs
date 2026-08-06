/**
 * scripts/generate-pwa-icons.mjs
 *
 * Generates all required PWA icon variants from public/images/logo.png.
 *
 * Source: 3907×3133 — large enough, but NOT square.
 * All outputs use fit:'contain' onto a square canvas to avoid stretching.
 *
 * Run: node scripts/generate-pwa-icons.mjs
 * Or:  npm run pwa:icons
 */

import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const SOURCE = path.join(ROOT, 'public', 'images', 'logo.png');
const ICONS_DIR = path.join(ROOT, 'public', 'icons');
const APP_DIR = path.join(ROOT, 'app');

const BACKGROUND_LIGHT = '#f9f9f9'; // --background light from globals.css
const BACKGROUND_DARK = '#000000';  // not used for icons, here for reference

// ── Preflight ────────────────────────────────────────────────────────────────
if (!existsSync(SOURCE)) {
  console.error(`✗ Source not found: ${SOURCE}`);
  process.exit(1);
}

const metadata = await sharp(SOURCE).metadata();
console.log(`Source: ${metadata.width}×${metadata.height} (${SOURCE})`);

if (metadata.width < 512 || metadata.height < 512) {
  console.error(
    `✗ Source image is ${metadata.width}×${metadata.height}. Minimum is 512px on both axes.`
  );
  process.exit(1);
}

await mkdir(ICONS_DIR, { recursive: true });

// ── Helper ───────────────────────────────────────────────────────────────────

/**
 * Resize to a square canvas using fit:'contain'.
 * @param {number} size   Output size in pixels (square)
 * @param {string} bg     Background colour
 * @param {number} [pad]  Extra padding fraction (0–1). 0.2 means 80% safe zone.
 */
async function toSquare(size, bg, pad = 0) {
  const innerSize = Math.round(size * (1 - pad * 2));
  return sharp(SOURCE)
    .resize(innerSize, innerSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .extend({
      top: Math.round(size * pad),
      bottom: Math.round(size * pad),
      left: Math.round(size * pad),
      right: Math.round(size * pad),
      background: bg,
    });
}

/**
 * Resize onto a solid coloured square canvas.
 */
async function toOpaquSquare(size, bg, pad = 0) {
  const innerSize = Math.round(size * (1 - pad * 2));
  const padding = Math.round(size * pad);

  // Create opaque background
  const background = await sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: bg,
    },
  })
    .png()
    .toBuffer();

  // Resize logo with contain
  const logo = await sharp(SOURCE)
    .resize(innerSize, innerSize, {
      fit: 'contain',
      background: bg,
    })
    .png()
    .toBuffer();

  // Composite logo onto background
  return sharp(background).composite([
    { input: logo, top: padding, left: padding },
  ]);
}

// ── Generate icons ────────────────────────────────────────────────────────────

const tasks = [];

// purpose: "any" — transparent background
for (const size of [192, 512]) {
  tasks.push(
    (await toSquare(size, { r: 0, g: 0, b: 0, alpha: 0 }))
      .png()
      .toFile(path.join(ICONS_DIR, `icon-${size}.png`))
      .then(() => console.log(`✓ public/icons/icon-${size}.png`))
  );
}

// purpose: "maskable" — logo at ~60% of canvas on opaque background
// Safe zone is 80% of canvas; we use 20% padding each side = 60% inner
for (const size of [192, 512]) {
  tasks.push(
    (await toOpaquSquare(size, BACKGROUND_LIGHT, 0.2))
      .png()
      .toFile(path.join(ICONS_DIR, `maskable-${size}.png`))
      .then(() => console.log(`✓ public/icons/maskable-${size}.png`))
  );
}

// app/apple-icon.png — 180×180, opaque (iOS renders transparency as black)
tasks.push(
  (await toOpaquSquare(180, BACKGROUND_LIGHT, 0.1))
    .png()
    .toFile(path.join(APP_DIR, 'apple-icon.png'))
    .then(() => console.log('✓ app/apple-icon.png'))
);

// app/icon.png — 512×512, Next.js auto-emits <link rel="icon">
tasks.push(
  (await toOpaquSquare(512, BACKGROUND_LIGHT, 0.1))
    .png()
    .toFile(path.join(APP_DIR, 'icon.png'))
    .then(() => console.log('✓ app/icon.png'))
);

// Screenshots — solid colour placeholders
// Replace with real captures before launch. These unlock Chrome's rich install dialog.
const screenshotColour = { r: 249, g: 249, b: 249 }; // matches --background light

tasks.push(
  sharp({
    create: { width: 1080, height: 1920, channels: 3, background: screenshotColour },
  })
    .png()
    .toFile(path.join(ICONS_DIR, 'screenshot-narrow.png'))
    .then(() => console.log('✓ public/icons/screenshot-narrow.png (placeholder)'))
);

tasks.push(
  sharp({
    create: { width: 1920, height: 1080, channels: 3, background: screenshotColour },
  })
    .png()
    .toFile(path.join(ICONS_DIR, 'screenshot-wide.png'))
    .then(() => console.log('✓ public/icons/screenshot-wide.png (placeholder)'))
);

await Promise.all(tasks);
console.log('\n✓ All PWA icons generated.');
console.log('  Remember to replace screenshot placeholders with real captures before launch.');
