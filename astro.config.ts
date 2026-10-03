import type { AstroIntegration } from 'astro';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { site, findPlaceholders } from './src/config/site';

/** Lists every unfilled {{PLACEHOLDER}} in site.ts at the start of each build. */
const placeholderReport = (): AstroIntegration => ({
  name: 'outback:placeholder-report',
  hooks: {
    'astro:build:start': ({ logger }) => {
      const missing = findPlaceholders();
      if (missing.length === 0) return;
      logger.warn(`${missing.length} placeholder value(s) in src/config/site.ts still need real values:`);
      for (const line of missing) logger.warn(`  • ${line}`);
    },
  },
});

// https://astro.build/config
export default defineConfig({
  site: site.siteUrl,
  output: 'static',
  trailingSlash: 'ignore',
  // Astro 7 defaults to JSX whitespace rules, which drop the space between
  // inline elements across line breaks. Lossless HTML compression keeps it.
  compressHTML: true,
  integrations: [
    react(),
    sitemap({ filter: (page) => !page.includes('/404') }),
    placeholderReport(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
