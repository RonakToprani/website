// =========================================================
// Entry animation — an ink panel that wipes upward to reveal the site,
// with the logo flying from the centre of the panel to its real position
// in the header, after which the workspace assembles around it.
//
// Three rules this follows, because they're what separate an intro that
// reads as professional from one that reads as an obstacle:
//
//   1. It never gates content. The whole site renders underneath from the
//      first frame; this is an overlay that gets out of the way. Nothing
//      here delays what the browser paints.
//   2. It runs once per session, so navigating back or reloading doesn't
//      make anyone sit through it twice.
//   3. It doesn't run at all under prefers-reduced-motion.
//
// It is also skippable — any click, tap or keypress ends it immediately.
// Total runtime is ~950ms; everything animates on transform and opacity,
// which are GPU-composited and cause no layout work.
// =========================================================

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

const SESSION_KEY = "intro-played";

/** Size of the logo while it's centred on the panel, in px. */
const LOGO_SIZE = 64;

/** The panel's own ease — slow to start, decisive at the end. */
const WIPE_EASE: [number, number, number, number] = [0.76, 0, 0.24, 1];

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Whether the intro should play at all. False for reduced-motion users, for
 * anyone who has already seen it this session, and during SSR.
 */
export function shouldPlayIntro(): boolean {
  if (typeof window === "undefined") return false;
  if (prefersReducedMotion()) return false;
  try {
    return window.sessionStorage.getItem(SESSION_KEY) !== "1";
  } catch {
    // Private mode / storage disabled — play it, but don't crash.
    return true;
  }
}

export function markIntroPlayed() {
  try {
    window.sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* storage unavailable; the intro simply replays next navigation */
  }
}

export function IntroOverlay({ onDone }: { onDone: () => void }) {
  const done = useRef(false);
  const [target, setTarget] = useState<{ dx: number; dy: number; scale: number } | null>(null);

  // Measure where the header logo actually sits, so the centred logo can fly
  // to its real resting place rather than to a hardcoded guess. Before paint,
  // so the flight doesn't start against a null target and then restart.
  useLayoutEffect(() => {
    const el = document.querySelector<HTMLImageElement>('img[src="/logo.svg"]');
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (!r.width) return;
    setTarget({
      dx: r.left + r.width / 2 - window.innerWidth / 2,
      dy: r.top + r.height / 2 - window.innerHeight / 2,
      scale: r.width / LOGO_SIZE,
    });
  }, []);

  const finish = useMemo(
    () => () => {
      if (done.current) return;
      done.current = true;
      markIntroPlayed();
      onDone();
    },
    [onDone]
  );

  // Skip on any interaction, and hard-stop after the timeline plus a margin so
  // a dropped animation frame can never strand someone behind the panel.
  useEffect(() => {
    const skip = () => finish();
    window.addEventListener("pointerdown", skip);
    window.addEventListener("keydown", skip);
    const bail = setTimeout(finish, 1600);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
      clearTimeout(bail);
      document.body.style.overflow = overflow;
    };
  }, [finish]);

  // pointer-events stay ON for the whole intro: the panel hides the UI for the
  // first 450ms, so a tap meant as "skip" must not land on a nav button the
  // visitor can't see. The overlay unmounts the moment it finishes.
  return (
    <div className="fixed inset-0 z-[200]" aria-hidden="true">
      {/* The panel. Wipes upward, taking a hairline edge with it so the wipe
          stays legible in dark mode, where it would otherwise be black on black. */}
      <motion.div
        className="absolute inset-0 bg-[#0a0a0b] border-b border-white/15"
        initial={{ y: 0 }}
        animate={{ y: "-100%" }}
        transition={{ delay: 0.45, duration: 0.55, ease: WIPE_EASE }}
        onAnimationComplete={finish}
      />

      {/* The logo sits outside the panel so it stays put while the panel
          leaves, then travels to the header. */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <motion.img
          src="/logo.svg"
          alt=""
          width={LOGO_SIZE}
          height={LOGO_SIZE}
          initial={{ opacity: 0, scale: 0.92, x: 0, y: 0 }}
          animate={
            target
              ? {
                  opacity: [0, 1, 1, 1],
                  scale: [0.92, 1, 1, target.scale],
                  x: [0, 0, 0, target.dx],
                  y: [0, 0, 0, target.dy],
                }
              : { opacity: [0, 1, 1, 0], scale: [0.92, 1, 1, 1] }
          }
          transition={{
            duration: 0.95,
            times: [0, 0.34, 0.45, 1],
            ease: ["easeOut", "linear", WIPE_EASE],
          }}
        />
      </div>
    </div>
  );
}
