/**
 * Single source of truth for links, feature flags, products and section copy.
 * Components read from here — nothing user-facing is hard-coded elsewhere.
 *
 * Values wrapped in {{DOUBLE_BRACES}} are placeholders. The build prints a
 * warning listing every placeholder that still needs a real value.
 */

export const FRAMEWORKS = ['ESX', 'QBCore', 'Qbox', 'Standalone'] as const;
export type Framework = (typeof FRAMEWORKS)[number];

export interface Product {
  name: string;
  description: string;
  framework: Framework[];
  /** Display string, e.g. "$24.99" or "From $15". */
  price: string;
  tebexUrl: string;
  /** Short muted loop (mp4/webm) or GIF. Lazy-loaded; poster shows first. */
  previewVideo?: string;
  /** Still frame shown before the preview loads. Strongly recommended. */
  poster?: string;
  docsUrl?: string;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface Commitment {
  title: string;
  body: string;
}

export interface ProcessStep {
  title: string;
  body: string;
}

export interface FaqItem {
  q: string;
  /** May contain the token {tebexRefundPolicyUrl}, which renders as a link. */
  a: string;
}

export interface BotUseCase {
  title: string;
  body: string;
  icon: 'clipboard' | 'shield' | 'cart' | 'signal' | 'scroll';
}

export const site = {
  name: 'Outback Services',
  shortName: 'Outback',
  tagline: 'Premium FiveM scripts & custom Discord bots',

  // ── Links ────────────────────────────────────────────────────────────────
  siteUrl: 'https://outbackdev.com',
  discordUrl: 'https://discord.gg/outback',
  wallyInviteUrl: 'https://discord.com/oauth2/authorize?client_id=1553018928219824278',
  tebexUrl: 'https://outbackdev.tebex.io/',
  tebexRefundPolicyUrl: 'https://discord.com/channels/1555560577194004523/1555811122479763476',
  githubUrl: 'https://github.com/outback-services',
  githubOrg: 'outback-services',

  // ── FiveM ────────────────────────────────────────────────────────────────
  frameworks: [...FRAMEWORKS] as Framework[],
  products: [] as Product[],
  fivemCallouts: [
    'Escrowed via Cfx.re',
    'Optimized for low resmon',
    'Config-driven',
    'Free updates',
  ],
  fivem: {
    title: 'FiveM scripts that stay out of your resmon',
    lead: 'Escrowed resources for roleplay servers, sold through Tebex and delivered straight to your Cfx.re account. Every script ships with readable configs and install docs.',
    emptyTitle: 'First releases coming soon',
    emptyBody: 'Join the Discord for early access and a say in what ships first.',
    // In-game notification mockup (decorative)
    notifyTitle: 'Outback Garage',
    notifyBody: 'Vehicle stored at Legion Square.',
    customTitle: 'Need something custom?',
    customBody: 'Tell us what your server needs. We’ll scope it with you and send a fixed quote before any work starts.',
    customCta: 'Open a ticket',
  },

  // ── Feature flags ────────────────────────────────────────────────────────
  /** When true, the Work section fetches public repos at build time. */
  showGithubRepos: false,

  // ── Navigation ───────────────────────────────────────────────────────────
  nav: [
    { label: 'FiveM', href: '#fivem' },
    { label: 'Discord Bots', href: '#bots' },
    { label: 'Wally', href: '#wally' },
    { label: 'Process', href: '#process' },
    { label: 'FAQ', href: '#faq' },
  ] as NavLink[],

  // ── Hero ─────────────────────────────────────────────────────────────────
  hero: {
    // The one wide-tracked tagline on the page (brand banner treatment).
    tagline: 'Scripts and bots for serious RP servers',
    // Rendered as: {headlineLead} <gradient>{headlineHighlight}</gradient>
    headlineLead: 'FiveM scripts & Discord bots,',
    headlineHighlight: 'built properly.',
    subline:
      'Escrowed resources and bespoke bots for roleplay communities that care about performance, clean configs and real support.',
    primaryCta: 'Join the Discord',
    secondaryCta: 'Browse scripts',
  },

  // ── Custom Discord bots ──────────────────────────────────────────────────
  bots: {
    title: 'Custom Discord bots, built around your server',
    lead: 'Your community runs on Discord as much as it runs in-game. We build bots that handle the busywork, so your staff can get back to running RP.',
    cta: 'Open a ticket',
    ctaNote: 'Tell us what you need and we’ll come back with a scope and a fixed quote.',
  },
  botUseCases: [
    {
      title: 'Whitelist applications',
      body: 'Multi-step forms, staff review queues and automatic role grants on approval.',
      icon: 'clipboard',
    },
    {
      title: 'Staff tools',
      body: 'Shift tracking, infractions, notes and audit trails your admin team will actually use.',
      icon: 'shield',
    },
    {
      title: 'Tebex role sync',
      body: 'Purchases land as Discord roles automatically, with expiry handled for subscriptions.',
      icon: 'cart',
    },
    {
      title: 'Server status',
      body: 'Live player counts, restart notices and uptime alerts pinned where your players look.',
      icon: 'signal',
    },
    {
      title: 'Logging',
      body: 'In-game and Discord events piped to tidy, searchable log channels.',
      icon: 'scroll',
    },
  ] as BotUseCase[],

  // ── Wally ────────────────────────────────────────────────────────────────
  wallyFeatures: ['Moderation', 'Utility', 'Tickets', 'Levels', 'Giveaways'],
  wally: {
    title: 'Meet Wally. He’s free.',
    lead: 'Wally is our own Discord bot, free for any server. He handles moderation, tickets, levels and giveaways, and he’s a taste of how we build everything else.',
    cta: 'Add Wally — it’s free',
    // Chat demo copy
    channel: 'giveaways',
    demoUser: 'Tucker',
    giveawayPrize: 'Custom MLO',
  },
  wallyAbout:'Free bot by Outback Services. Moderation, tickets, levels and giveaways for your community.',
  /** Shown in the faux slash-command popup. */
  wallyCommands: [
    { name: 'giveaway start', description: 'Run a giveaway in this channel' },
    { name: 'ticket open', description: 'Open a private support ticket' },
    { name: 'rank', description: 'Check your level and XP' },
    { name: 'warn', description: 'Warn a member, with a logged reason' },
  ],

  // ── Standards ────────────────────────────────────────────────────────────
  standardsTitle: 'What you can count on',
  standards: [
    {
      title: 'Every release is performance tested.',
      body: 'Scripts are profiled on a live server before they ship. If something shows up in resmon, it gets fixed first.',
    },
    {
      title: 'Configs you can actually read.',
      body: 'Sensible defaults and clearly commented options. Changing a label or a price never means digging through code.',
    },
    {
      title: 'Documented before it ships.',
      body: 'Install steps, config references and exports are written down, not left in someone’s head.',
    },
    {
      title: 'Supported in Discord.',
      body: 'Questions and bug reports go to the person who wrote the code, in a ticket you can follow.',
    },
  ] as Commitment[],

  // ── Process ──────────────────────────────────────────────────────────────
  processTitle: 'How a commission works',
  processLead: 'Every custom job, FiveM or Discord, follows the same five steps. You’ll always know where things are.',
  process: [
    { title: 'Open a ticket', body: 'Tell us what you need in the Outback Discord.' },
    { title: 'Scope & quote', body: 'We pin down features, framework and a fixed price.' },
    { title: 'Build', body: 'Regular progress updates in your ticket as it comes together.' },
    { title: 'Test on your server', body: 'You try it live and we tune it to your setup.' },
    { title: 'Deliver & support', body: 'Handover with docs, then ongoing support in Discord.' },
  ] as ProcessStep[],

  // ── Founder ──────────────────────────────────────────────────────────────
  founder: {
    title: 'Who you’ll be working with',
    name: 'Tucker',
    role: 'Wally Founder & Developer',
    bio: 'Experienced FiveM and Discord Developer',
    /** Path under /public. Leave empty to show the placeholder. */
    avatar: '',
    cta: 'Say g’day in the Discord',
  },

  // ── Work / open source (hidden unless showGithubRepos) ──────────────────
  work: {
    title: 'Open source',
    lead: 'Some of what we build is public. Have a look at the code.',
  },

  // ── FAQ ──────────────────────────────────────────────────────────────────
  faqTitle: 'Questions we get a lot',
  faq: [
    {
      q: 'What does “escrowed” mean for me as a buyer?',
      a: 'Escrowed scripts are protected by Cfx.re’s asset escrow and tied to your server key. You get full use of the resource and all its config files; the core logic is encrypted so it can’t be leaked or resold.',
    },
    {
      q: 'Which frameworks do your scripts support?',
      a: 'Each script lists its supported frameworks on its card and Tebex page. Most releases target ESX, QBCore and Qbox, and some run standalone. If yours isn’t listed, ask in Discord before buying.',
    },
    {
      q: 'How are custom commissions quoted?',
      a: 'Open a ticket with what you need. We’ll scope it with you, then give a fixed quote covering features, timeline and support before any work starts. No surprise invoices.',
    },
    {
      q: 'Do I get updates and support?',
      a: 'Yes. Purchased scripts get free updates for the life of the product, and support runs through tickets in our Discord. Commissions include a support window agreed in the quote.',
    },
    {
      q: 'What is your refund policy?',
      a: 'Store purchases are handled by Tebex and follow our store’s {tebexRefundPolicyUrl}. If something isn’t working, open a ticket first. We’ll usually fix it fast.',
    },
    {
      q: 'What timezone are you in? How fast will you reply?',
      a: 'We’re based in Australia and work with communities worldwide. Tickets are usually answered within a business day, and overlapping with US and EU evenings is part of the routine, mate.',
    },
  ] as FaqItem[],

  // ── Final CTA ────────────────────────────────────────────────────────────
  finalCta: {
    title: 'Got a server that deserves better?',
    body: 'Jump in the Discord, open a ticket and tell us what you’re building.',
  },

  // ── Footer ───────────────────────────────────────────────────────────────
  footer: {
    disclaimer:
      'Outback Services is an independent studio and is not affiliated with or endorsed by Discord Inc., Cfx.re or Rockstar Games.',
  },

  // ── SEO ──────────────────────────────────────────────────────────────────
  seo: {
    title: 'Outback Services — Premium FiveM Scripts & Custom Discord Bots',
    description:
      'Premium escrowed FiveM scripts for ESX, QBCore and Qbox, plus custom Discord bots for roleplay communities. Optimized, documented and supported.',
    keywords: [
      'FiveM scripts',
      'QBCore scripts',
      'ESX scripts',
      'Qbox scripts',
      'custom Discord bot',
      'FiveM roleplay',
      'Tebex',
    ],
  },
};

export type SiteConfig = typeof site;

/** True when a config value is still a {{PLACEHOLDER}}. */
export const isPlaceholder = (value: string): boolean => /^\{\{.+\}\}$/.test(value.trim());

/** Collects every unfilled placeholder so the build can report them. */
export function findPlaceholders(): string[] {
  const found: string[] = [];
  const walk = (value: unknown, path: string) => {
    if (typeof value === 'string') {
      if (isPlaceholder(value)) found.push(`${path} = ${value}`);
    } else if (Array.isArray(value)) {
      value.forEach((v, i) => walk(v, `${path}[${i}]`));
    } else if (value && typeof value === 'object') {
      for (const [k, v] of Object.entries(value)) walk(v, path ? `${path}.${k}` : k);
    }
  };
  walk(site, '');
  return found;
}
