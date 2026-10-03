/**
 * Animated fake Discord chat: a user runs /giveaway start, Wally replies with
 * an embed, reactions pop in. Loops only while in view; under reduced motion
 * it renders the finished conversation with no animation.
 */
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

interface Props {
  channel: string;
  user: string;
  prize: string;
  /** Generated Wally avatar URL, or null while the PNG is missing. */
  avatarSrc: string | null;
}

const COMMAND = '/giveaway start';
const REACTIONS = [
  { emoji: '🎉', max: 3 },
  { emoji: '🦘', max: 1 },
];

// step: 0 typing → 1 sent → 2 embed → 3+ reactions → done (hold, then reset)
const FINAL_STEP = 3 + REACTIONS.reduce((n, r) => n + r.max, 0);

export default function WallyChatDemo({ channel, user, prize, avatarSrc }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const inView = useInView(root, { amount: 0.4 });
  const reduced = useReducedMotion();
  const [typed, setTyped] = useState(0);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (reduced) {
      setTyped(COMMAND.length);
      setStep(FINAL_STEP);
      return;
    }
    if (!inView) return; // pause where we are while off-screen

    let t: ReturnType<typeof setTimeout>;
    if (step === 0) {
      t = setTimeout(
        () => (typed < COMMAND.length ? setTyped(typed + 1) : setStep(1)),
        typed === 0 ? 700 : typed < COMMAND.length ? 65 : 450,
      );
    } else if (step < FINAL_STEP) {
      t = setTimeout(() => setStep(step + 1), step === 1 ? 650 : step === 2 ? 900 : 420);
    } else {
      t = setTimeout(() => {
        setTyped(0);
        setStep(0);
      }, 3600);
    }
    return () => clearTimeout(t);
  }, [inView, reduced, step, typed]);

  // How many reaction clicks have landed, spread across the reaction list.
  let remaining = Math.max(0, step - 3);
  const counts = REACTIONS.map((r) => {
    const n = Math.min(r.max, remaining);
    remaining -= n;
    return n;
  });

  const enter = reduced ? false : { opacity: 0, y: 8 };

  return (
    <div
      ref={root}
      role="img"
      aria-label={`Example: ${user} runs ${COMMAND} and Wally posts a giveaway that members react to.`}
      className="overflow-hidden rounded-panel border border-glass-border bg-ink-800 shadow-panel"
    >
      <div aria-hidden="true">
        {/* Channel header */}
        <div className="flex items-center gap-2 border-b border-glass-border px-4 py-3 text-sm font-semibold text-fg">
          <span className="text-lg leading-none text-fg-subtle">#</span>
          {channel}
        </div>

        {/* Messages */}
        <div className="flex min-h-[19rem] flex-col justify-end gap-4 px-4 py-5 sm:min-h-[20rem]">
          <AnimatePresence initial={false}>
            {step >= 1 && (
              <motion.div
                key="command"
                initial={enter}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 pl-12 text-xs text-fg-subtle"
              >
                <span className="font-semibold text-fg-muted">{user}</span> used
                <span className="rounded-[4px] bg-wally/15 px-1 font-medium text-wally">{COMMAND}</span>
              </motion.div>
            )}

            {step >= 2 && (
              <motion.div
                key="reply"
                initial={enter}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="-mt-2 flex gap-3"
              >
                <Avatar src={avatarSrc} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-sm font-bold text-fg">
                    Wally
                    <span className="inline-flex items-center gap-0.5 rounded-[4px] bg-blurple px-1 py-px text-[10px] leading-tight font-semibold text-white">
                      <svg viewBox="0 0 16 16" className="size-2.5">
                        <path fill="currentColor" d="M6.2 11.6 2.6 8l1.1-1.1 2.5 2.5 6.1-6.1 1.1 1.1z" />
                      </svg>
                      BOT
                    </span>
                  </p>

                  {/* Embed */}
                  <div className="mt-1.5 max-w-sm rounded-[4px] border-l-4 border-wally bg-ink-950/60 p-3.5">
                    <p className="text-sm font-bold text-fg">🎉 Giveaway: {prize}</p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-fg-muted">
                      React with 🎉 to enter.
                      <br />
                      Hosted by <span className="font-medium text-wally">@{user}</span>
                    </p>
                    <p className="mt-2.5 text-[11px] text-fg-subtle">Ends in 24 hours</p>
                  </div>

                  {/* Reactions */}
                  <div className="mt-2 flex h-7 gap-1.5">
                    {REACTIONS.map((r, i) =>
                      counts[i] > 0 ? (
                        <motion.span
                          key={r.emoji}
                          initial={reduced ? false : { scale: 0.4, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 520, damping: 22 }}
                          className="inline-flex items-center gap-1 rounded-[6px] border border-wally/60 bg-wally/15 px-1.5 text-xs font-semibold text-fg"
                        >
                          <span className="text-sm leading-none">{r.emoji}</span>
                          <motion.span
                            key={counts[i]}
                            initial={reduced ? false : { y: -6, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                          >
                            {counts[i]}
                          </motion.span>
                        </motion.span>
                      ) : null,
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Message box */}
        <div className="px-4 pb-4">
          <div className="flex h-11 items-center rounded-[6px] bg-ink-700/70 px-4 text-sm">
            {step === 0 && typed > 0 ? (
              <span className="text-fg">
                {COMMAND.slice(0, typed)}
                <span className="ml-px inline-block h-4 w-px translate-y-0.5 bg-fg" />
              </span>
            ) : (
              <span className="text-fg-subtle">Message #{channel}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Avatar({ src }: { src: string | null }) {
  return src ? (
    <img src={src} alt="" width={40} height={40} loading="lazy" className="size-10 shrink-0 rounded-full" />
  ) : (
    <span className="grid size-10 shrink-0 place-items-center rounded-full border border-dashed border-glass-border-strong bg-ink-700 text-[0.6rem] font-extrabold text-fg-muted">
      W?
    </span>
  );
}
