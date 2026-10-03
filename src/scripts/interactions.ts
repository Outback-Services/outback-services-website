/**
 * Small, dependency-free interaction layer. Loaded once from Base.astro.
 *
 * - Nav: glassy background once scrolled; accessible mobile menu
 * - In-view: toggles data-inview on [data-anim-scope] so CSS loops pause off-screen
 * - Reveal: fades/rises [data-reveal] once, staggering [data-reveal-group] children
 * - Magnetic CTAs and card spotlights: fine pointers only, never under reduced motion
 * - Videos marked [data-inview-play] play only while visible
 */

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');

/* ── Nav ─────────────────────────────────────────────────────────────── */
function initNav() {
  const nav = document.querySelector<HTMLElement>('[data-nav]');
  if (!nav) return;

  const onScroll = () => nav.toggleAttribute('data-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const toggle = nav.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const menu = document.getElementById(toggle?.getAttribute('aria-controls') ?? '');
  if (!toggle || !menu) return;

  const setOpen = (open: boolean) => {
    toggle.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
    nav.toggleAttribute('data-open', open);
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) {
      setOpen(false);
      toggle.focus();
    }
  });
  matchMedia('(min-width: 768px)').addEventListener('change', (e) => e.matches && setOpen(false));
}

/* ── In-view scopes (pause loops off-screen) ─────────────────────────── */
function initInView() {
  const scopes = document.querySelectorAll<HTMLElement>('[data-anim-scope]');
  if (!scopes.length) return;
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.target.toggleAttribute('data-inview', e.isIntersecting)),
    { rootMargin: '80px 0px' },
  );
  scopes.forEach((s) => io.observe(s));
}

/* ── Scroll reveal ───────────────────────────────────────────────────── */
function initReveal() {
  const items = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (!items.length) return;
  if (reducedMotion.matches) {
    items.forEach((el) => el.classList.add('is-revealed'));
    return;
  }
  document.querySelectorAll<HTMLElement>('[data-reveal-group]').forEach((group) => {
    group.querySelectorAll<HTMLElement>(':scope > [data-reveal]').forEach((child, i) => {
      child.style.setProperty('--reveal-delay', `${Math.min(i, 6) * 70}ms`);
    });
  });
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-revealed');
        io.unobserve(e.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
  );
  items.forEach((el) => io.observe(el));
}

/* ── Magnetic CTAs ───────────────────────────────────────────────────── */
function initMagnetic() {
  if (!finePointer.matches || reducedMotion.matches) return;
  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    const strength = 0.22;
    el.style.transition = 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)';
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) * strength;
      const y = (e.clientY - (r.top + r.height / 2)) * strength;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.transform = '';
    });
  });
}

/* ── Card spotlight ──────────────────────────────────────────────────── */
function initSpotlight() {
  if (!finePointer.matches || reducedMotion.matches) return;
  document.querySelectorAll<HTMLElement>('[data-spotlight]').forEach((card) => {
    const blob = card.querySelector<HTMLElement>('.spotlight-blob');
    if (!blob) return;
    let frame = 0;
    card.addEventListener('pointermove', (e) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = card.getBoundingClientRect();
        blob.style.transform = `translate3d(${e.clientX - r.left}px, ${e.clientY - r.top}px, 0)`;
      });
    });
  });
}

/* ── Videos that play only while visible ─────────────────────────────── */
function initVideos() {
  const videos = document.querySelectorAll<HTMLVideoElement>('video[data-inview-play]');
  if (!videos.length || reducedMotion.matches) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        const v = e.target as HTMLVideoElement;
        if (e.isIntersecting) {
          if (v.preload === 'none') v.preload = 'auto';
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      });
    },
    { threshold: 0.35 },
  );
  videos.forEach((v) => io.observe(v));
}

initNav();
initInView();
initReveal();
initMagnetic();
initSpotlight();
initVideos();
