/**
 * Brand asset pipeline. Runs before `dev`, `build` and `check`.
 *
 * Source:  public/brand/wally-avatar.png   (supplied by hand, never generated)
 * Outputs: public/brand/generated/wally-{256,512,768}.{avif,webp}
 *          public/favicon.ico, favicon-32.png, apple-touch-icon.png, icon-{192,512}.png
 *          public/site.webmanifest
 *          public/og.png                    (1200×630 Open Graph card)
 *          src/data/brand.generated.json    (read by components)
 *
 * If the avatar is missing, nothing Wally-shaped is produced: components show a
 * labelled placeholder, and favicons/OG fall back to a plain wordmark monogram.
 * If the avatar has an opaque white background, the script warns loudly and
 * records `whiteBg: true` — it never tries to mask it.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import sharp from 'sharp';
import { site } from '../src/config/site.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const p = (...parts: string[]) => join(root, ...parts);

const SOURCE = p('public/brand/wally-avatar.png');
const GEN_DIR = p('public/brand/generated');
const MANIFEST = p('src/data/brand.generated.json');
const AVATAR_WIDTHS = [256, 512, 768];
const PIPELINE_VERSION = 2; // bump to force regeneration after editing this script

// ── Tokens: read straight from the Tailwind @theme so there is one source ──
const css = readFileSync(p('src/styles/global.css'), 'utf8');
const token = (name: string): string => {
  const m = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`Token --color-${name} not found in global.css`);
  return m[1];
};
const c = {
  ink950: token('ink-950'),
  ink900: token('ink-900'),
  magenta: token('magenta'),
  violet: token('violet'),
  cyan: token('cyan'),
  fg: token('fg'),
};

const log = (msg: string) => console.log(`[brand] ${msg}`);
const warn = (msg: string) => console.warn(`\x1b[33m[brand] ⚠ ${msg}\x1b[0m`);

interface BrandManifest {
  version: number;
  sourceHash: string | null;
  hasWally: boolean;
  whiteBg: boolean;
  width: number | null;
  height: number | null;
  avatar: { avif: string; webp: string; widths: number[] } | null;
}

// ── Satori helpers ─────────────────────────────────────────────────────────
type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, ...children: unknown[]): Node => ({
  type,
  props: { style, children: children.length === 0 ? undefined : children.length === 1 ? children[0] : children },
});

const fontFile = (pkg: string, file: string) => readFileSync(p('node_modules', pkg, 'files', file));
const fonts = [
  { name: 'Outfit', data: fontFile('@fontsource/outfit', 'outfit-latin-800-normal.woff'), weight: 800 as const, style: 'normal' as const },
  { name: 'Outfit', data: fontFile('@fontsource/outfit', 'outfit-latin-900-normal.woff'), weight: 900 as const, style: 'normal' as const },
  { name: 'Inter', data: fontFile('@fontsource/inter', 'inter-latin-600-normal.woff'), weight: 600 as const, style: 'normal' as const },
];

async function renderPng(node: Node, width: number, height: number): Promise<Buffer> {
  const svg = await satori(node as never, { width, height, fonts });
  return new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();
}

const brandGradient = `linear-gradient(100deg, ${c.magenta}, ${c.violet}, ${c.cyan})`;

// ── Avatar checks ──────────────────────────────────────────────────────────
async function detectWhiteBackground(file: string): Promise<boolean> {
  const img = sharp(file);
  const { width = 0, height = 0, hasAlpha } = await img.metadata();
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = (x: number, y: number) => {
    const i = (y * info.width + x) * info.channels;
    return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
  };
  const inset = Math.max(1, Math.round(Math.min(width, height) * 0.02));
  const corners = [
    px(inset, inset),
    px(width - 1 - inset, inset),
    px(inset, height - 1 - inset),
    px(width - 1 - inset, height - 1 - inset),
  ];
  const opaqueWhite = corners.filter((q) => q.a > 240 && q.r > 235 && q.g > 235 && q.b > 235);
  // A circular avatar on a transparent canvas has fully transparent corners.
  return opaqueWhite.length >= 3 || (!hasAlpha && opaqueWhite.length >= 1);
}

// ── ICO writer (PNG-in-ICO, supported by every modern browser) ─────────────
function pngToIco(png: Buffer, size: number): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0);
  entry.writeUInt8(size >= 256 ? 0 : size, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(6 + 16, 12);
  return Buffer.concat([header, entry, png]);
}

// ── Icon sources ───────────────────────────────────────────────────────────
/** Fallback monogram used only while the Wally avatar is missing. */
async function monogramPng(size: number): Promise<Buffer> {
  return renderPng(
    h(
      'div',
      {
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: size,
        backgroundImage: brandGradient,
      },
      h(
        'div',
        {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size * 0.82,
          height: size * 0.82,
          borderRadius: size,
          backgroundColor: c.ink950,
          color: c.fg,
          fontFamily: 'Outfit',
          fontWeight: 900,
          fontSize: size * 0.5,
        },
        'O',
      ),
    ),
    size,
    size,
  );
}

async function writeIcons(source: Buffer | null) {
  const make = async (size: number) =>
    source
      ? sharp(source).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()
      : monogramPng(size);

  const fav32 = await make(32);
  writeFileSync(p('public/favicon-32.png'), fav32);
  writeFileSync(p('public/favicon.ico'), pngToIco(fav32, 32));
  writeFileSync(p('public/icon-192.png'), await make(192));
  writeFileSync(p('public/icon-512.png'), await make(512));

  // Apple ignores transparency, so composite onto the page background.
  const apple = await sharp(await make(160))
    .extend({ top: 10, bottom: 10, left: 10, right: 10, background: c.ink950 })
    .flatten({ background: c.ink950 })
    .png()
    .toBuffer();
  writeFileSync(p('public/apple-touch-icon.png'), apple);

  writeFileSync(
    p('public/site.webmanifest'),
    JSON.stringify(
      {
        name: site.name,
        short_name: site.shortName,
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
        theme_color: c.ink950,
        background_color: c.ink950,
        display: 'standalone',
        start_url: '/',
      },
      null,
      2,
    ),
  );
  log(`icons written (${source ? 'from Wally avatar' : 'fallback monogram'})`);
}

// ── Open Graph card ────────────────────────────────────────────────────────
async function writeOgImage(source: Buffer | null) {
  const W = 1200;
  const H = 630;
  const avatarSize = 380;
  const avatarDataUri = source
    ? `data:image/png;base64,${(await sharp(source).resize(avatarSize, avatarSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()).toString('base64')}`
    : null;

  const glow = (color: string, x: number, y: number, size: number) =>
    h('div', {
      position: 'absolute',
      left: x,
      top: y,
      width: size,
      height: size,
      borderRadius: size,
      backgroundImage: `radial-gradient(circle, ${color}66 0%, ${color}00 70%)`,
    });

  const node = h(
    'div',
    {
      width: W,
      height: H,
      display: 'flex',
      position: 'relative',
      backgroundImage: `linear-gradient(135deg, ${c.ink950}, ${c.ink900})`,
      fontFamily: 'Inter',
      color: c.fg,
      overflow: 'hidden',
    },
    glow(c.magenta, -260, -300, 760),
    glow(c.cyan, 760, 220, 760),
    h(
      'div',
      { display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 0 0 80px', width: avatarDataUri ? 720 : W },
      h(
        'div',
        { display: 'flex', fontSize: 20, fontWeight: 600, letterSpacing: 6, textTransform: 'uppercase', color: c.cyan, marginBottom: 22 },
        'FiveM scripts · Discord bots',
      ),
      h(
        'div',
        {
          display: 'flex',
          fontFamily: 'Outfit',
          fontWeight: 900,
          fontSize: 92,
          lineHeight: 1,
          letterSpacing: -2,
          backgroundImage: brandGradient,
          backgroundClip: 'text',
          color: 'transparent',
        },
        'OUTBACK',
      ),
      h(
        'div',
        { display: 'flex', fontFamily: 'Outfit', fontWeight: 800, fontSize: 56, lineHeight: 1.05, marginTop: 4 },
        'SERVICES',
      ),
      h(
        'div',
        { display: 'flex', fontSize: 26, fontWeight: 600, marginTop: 34, color: c.fg, opacity: 0.78, maxWidth: 580 },
        site.tagline,
      ),
    ),
    avatarDataUri
      ? h(
          'div',
          { position: 'absolute', right: 70, top: (H - avatarSize) / 2, display: 'flex' },
          { type: 'img', props: { src: avatarDataUri, width: avatarSize, height: avatarSize } },
        )
      : h('div', {}),
  );

  writeFileSync(p('public/og.png'), await renderPng(node, W, H));
  log(`og.png written (${source ? 'with Wally' : 'wordmark only'})`);
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  mkdirSync(GEN_DIR, { recursive: true });
  mkdirSync(dirname(MANIFEST), { recursive: true });

  const hasWally = existsSync(SOURCE);
  const source = hasWally ? readFileSync(SOURCE) : null;
  const sourceHash = source
    ? createHash('sha256').update(source).update(String(PIPELINE_VERSION)).digest('hex').slice(0, 16)
    : `none-v${PIPELINE_VERSION}`;

  // Skip work when nothing changed and outputs exist.
  if (existsSync(MANIFEST) && existsSync(p('public/og.png'))) {
    try {
      const prev = JSON.parse(readFileSync(MANIFEST, 'utf8')) as BrandManifest;
      if (prev.sourceHash === sourceHash) {
        log('up to date');
        if (!hasWally) warn('public/brand/wally-avatar.png is missing — placeholders are being rendered.');
        if (prev.whiteBg) warn('wally-avatar.png has an opaque WHITE background. Please supply a transparent PNG.');
        return;
      }
    } catch {
      /* regenerate */
    }
  }

  const manifest: BrandManifest = {
    version: PIPELINE_VERSION,
    sourceHash,
    hasWally,
    whiteBg: false,
    width: null,
    height: null,
    avatar: null,
  };

  if (source) {
    const meta = await sharp(source).metadata();
    manifest.width = meta.width ?? null;
    manifest.height = meta.height ?? null;
    manifest.whiteBg = await detectWhiteBackground(SOURCE);
    if (manifest.whiteBg) {
      warn('wally-avatar.png has an opaque WHITE background (no transparency at the corners).');
      warn('It will be shown as-is. Please supply a transparent PNG — it is not masked with CSS.');
    }

    for (const w of AVATAR_WIDTHS) {
      const base = sharp(source).resize(w, w, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
      await base.clone().avif({ quality: 60, effort: 6 }).toFile(join(GEN_DIR, `wally-${w}.avif`));
      await base.clone().webp({ quality: 82, alphaQuality: 90 }).toFile(join(GEN_DIR, `wally-${w}.webp`));
    }
    manifest.avatar = {
      avif: '/brand/generated/wally-{w}.avif',
      webp: '/brand/generated/wally-{w}.webp',
      widths: AVATAR_WIDTHS,
    };
    log(`avatar variants written (${AVATAR_WIDTHS.join(', ')}px, avif + webp)`);
  } else {
    warn('public/brand/wally-avatar.png is missing — placeholders will be rendered.');
  }

  await writeIcons(source);
  await writeOgImage(source);

  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  log('manifest written');
}

main().catch((err) => {
  console.error('[brand] failed:', err);
  process.exit(1);
});
