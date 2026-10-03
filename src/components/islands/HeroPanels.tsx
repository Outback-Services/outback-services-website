/**
 * Mouse-follow 3D tilt + parallax for the hero's floating Discord panels.
 *
 * Hydrated only on fine-pointer devices (client:media in Hero.astro), so touch
 * devices keep the server-rendered panels with their CSS idle bob and never
 * download React for the hero. Listens to the pointer only while the hero is
 * on screen, and does nothing under prefers-reduced-motion.
 */
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from 'motion/react';
import { useEffect, useRef, type ReactNode } from 'react';

const MAX_TILT = 8; // degrees, at depth 1
const MAX_SHIFT = 18; // px, at depth 1

interface LayerProps {
  depth: number;
  mx: MotionValue<number>;
  my: MotionValue<number>;
  children: ReactNode;
}

function Layer({ depth, mx, my, children }: LayerProps) {
  const rotateX = useTransform(my, (v) => -v * MAX_TILT * depth);
  const rotateY = useTransform(mx, (v) => v * MAX_TILT * depth);
  const x = useTransform(mx, (v) => v * MAX_SHIFT * depth);
  const y = useTransform(my, (v) => v * MAX_SHIFT * depth);
  return <motion.div style={{ rotateX, rotateY, x, y, transformPerspective: 900 }}>{children}</motion.div>;
}

interface Props {
  /** Named slots passed from Astro. */
  profile?: ReactNode;
  commands?: ReactNode;
}

export default function HeroPanels({ profile, commands }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const spring = { stiffness: 120, damping: 20, mass: 0.6 };
  const mx = useSpring(useMotionValue(0), spring);
  const my = useSpring(useMotionValue(0), spring);

  useEffect(() => {
    const el = root.current;
    const hero = el?.closest<HTMLElement>('[data-hero]');
    if (!el || !hero || reduced) return;

    let frame = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = hero.getBoundingClientRect();
        const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
        const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
        mx.set(Math.max(-1, Math.min(1, nx)));
        my.set(Math.max(-1, Math.min(1, ny)));
      });
    };
    const onLeave = () => {
      mx.set(0);
      my.set(0);
    };

    let listening = false;
    const start = () => {
      if (listening) return;
      listening = true;
      window.addEventListener('pointermove', onMove, { passive: true });
      hero.addEventListener('pointerleave', onLeave);
    };
    const stop = () => {
      if (!listening) return;
      listening = false;
      window.removeEventListener('pointermove', onMove);
      hero.removeEventListener('pointerleave', onLeave);
      onLeave();
    };

    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()));
    io.observe(hero);
    return () => {
      io.disconnect();
      stop();
      cancelAnimationFrame(frame);
    };
  }, [reduced, mx, my]);

  return (
    <div ref={root} className="pointer-events-none absolute inset-0" style={{ perspective: 1200 }}>
      {/* Base angle (static) → tilt layer (motion) → idle bob (CSS) */}
      <div className="absolute -top-[14%] -left-[20%] hidden sm:block" style={{ transform: 'rotate(-6deg) rotateY(14deg)' }}>
        <Layer depth={0.6} mx={mx} my={my}>
          <div className="motion-safe:animate-bob">{profile}</div>
        </Layer>
      </div>
      <div className="absolute -right-[12%] -bottom-[8%] hidden lg:block xl:-right-[24%]" style={{ transform: 'rotate(4deg) rotateY(-16deg)' }}>
        <Layer depth={1} mx={mx} my={my}>
          <div className="motion-safe:animate-bob [animation-delay:-2.5s]">{commands}</div>
        </Layer>
      </div>
    </div>
  );
}
