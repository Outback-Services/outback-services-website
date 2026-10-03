import manifest from '../data/brand.generated.json';

export interface BrandManifest {
  hasWally: boolean;
  whiteBg: boolean;
  avatar: { avif: string; webp: string; widths: number[] } | null;
}

export const brand = manifest as BrandManifest;

/** Builds a srcset for the generated Wally variants of one format. */
export function wallySrcset(format: 'avif' | 'webp'): string {
  if (!brand.avatar) return '';
  const pattern = brand.avatar[format];
  return brand.avatar.widths.map((w) => `${pattern.replace('{w}', String(w))} ${w}w`).join(', ');
}

/** Smallest generated variant ≥ the requested width, as a plain src fallback. */
export function wallySrc(minWidth = 512, format: 'avif' | 'webp' = 'webp'): string {
  if (!brand.avatar) return '';
  const w = brand.avatar.widths.find((x) => x >= minWidth) ?? brand.avatar.widths.at(-1)!;
  return brand.avatar[format].replace('{w}', String(w));
}
