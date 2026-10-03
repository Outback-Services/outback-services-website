import { isPlaceholder, site } from '../config/site';

/**
 * Resolves a config URL for use in an href. Unfilled {{PLACEHOLDER}} values
 * become "#" so dev/preview builds never ship a broken relative link.
 */
export function href(url: string): string {
  return isPlaceholder(url) ? '#' : url;
}

/** Attributes for links that leave the site. */
export function externalAttrs(url: string) {
  const resolved = href(url);
  const external = /^https?:\/\//.test(resolved);
  return {
    href: resolved,
    ...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
    ...(isPlaceholder(url) ? { 'data-placeholder': url } : {}),
  };
}

/** Public profile links for JSON-LD sameAs (placeholders excluded). */
export function sameAs(): string[] {
  return [site.discordUrl, site.githubUrl, site.tebexUrl].filter((u) => !isPlaceholder(u));
}
