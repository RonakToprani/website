// =========================================================
// Entry animation — the page composing itself.
//
// The idea: your hero headline is the word "hola". So the intro *is* that
// word. It rises out of a mask at display size, then glides down and shrinks
// until it lands exactly on the real <h1> and becomes it. There is no loading
// screen, no black panel, no logo — the site simply assembles around a word
// that was always going to be there.
//
// What makes it read as smooth rather than merely fast:
//
//   * One thing moves at a time. The word finishes rising before it starts
//     to travel; the hairline under it is gone before the flight begins.
//   * The right curve for each move. Rising in place is a short move, so it
//     gets expo-out (fast departure, long settle). The flight is a long
//     move across the screen, and expo-out there launches with a jolt — so it
//     gets a symmetric ease-in-out that accelerates and lands softly.
//   * A clean handoff. The real <h1> is hidden for the whole intro and the
//     card it sits in only fades (it never translates), so the target is
//     perfectly still. When the word lands, the overlay unmounts and the
//     <h1> appears in the same frame at the same pixel — no crossfade, no
//     ghosting, nothing to see.
//   * Compositor-only motion. Everything animates transform or opacity.
//
// Correctness, unchanged: it never blocks content (the site renders
// underneath from frame one), runs once per session, is skippable, and
// doesn't run at all under prefers-reduced-motion.
// =========================================================

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

const SESSION_KEY = "intro-played";

/** Expo-out — for short moves that should settle. */
const EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];
/** Symmetric ease-in-out — for the long flight, so it neither jolts nor brakes. */
const GLIDE: [number, number, number, number] = [0.65, 0, 0.35, 1];

/** Timeline, in seconds. The word rises for RISE, then *holds* — a beat where
 *  it is simply there, long enough to register — and only then flies. The
 *  hold is what separates composed from hurried; without it the word leaves
 *  while it's still settling. The workspace assembly in index.css is timed to
 *  be finished before the word lands (FLY_AT + FLY_FOR). */
const RISE = 0.5;
const FLY_AT = 0.74;
const FLY_FOR = 0.68;

/** id on the real hero headline, so the intro word knows where to land. */
export const HERO_ID = "hero-hola";

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function shouldPlayIntro(): boolean {
  if (typeof window === "undefined") return false;
  if (prefersReducedMotion()) return false;
  try {
    return window.sessionStorage.getItem(SESSION_KEY) !== "1";
  } catch {
    return true;
  }
}

function markIntroPlayed() {
  try {
    window.sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* storage unavailable; it simply replays next navigation */
  }
}

type Flight = { x: number; y: number; scale: number };

export function IntroOverlay({ onDone }: { onDone: () => void }) {
  const done = useRef(false);
  const wordRef = useRef<HTMLDivElement | null>(null);
  const [flight, setFlight] = useState<Flight | null>(null);

  // Lock scrolling *before* measuring: hiding the scrollbar re-centres the
  // layout, and measuring first would aim the word a few pixels off on any
  // system with a visible scrollbar. Then work out the transform that carries
  // the display-size word onto the real headline — align top-left corners,
  // scale by the font-size ratio. All before paint.
  useLayoutEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const target = document.getElementById(HERO_ID);
    const src = wordRef.current;
    if (target && src) {
      const t = target.getBoundingClientRect();
      const s = src.getBoundingClientRect();
      if (t.width && s.width) {
        const tSize = parseFloat(getComputedStyle(target).fontSize);
        const sSize = parseFloat(getComputedStyle(src).fontSize);
        setFlight({ x: t.left - s.left, y: t.top - s.top, scale: tSize / sSize });
      }
    }
    return () => {
      document.body.style.overflow = overflow;
    };
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

  useEffect(() => {
    const skip = () => finish();
    window.addEventListener("pointerdown", skip);
    window.addEventListener("keydown", skip);
    // Hard stop, so a dropped frame can never strand anyone behind the overlay.
    const bail = setTimeout(finish, 2200);
    return () => {
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
      clearTimeout(bail);
    };
  }, [finish]);

  // Pointer events stay on: the backdrop covers the UI early on, so a tap
  // meant as "skip" must not land on something the visitor can't see yet.
  return (
    <div className="fixed inset-0 z-[200] overflow-hidden" aria-hidden="true">
      {/* The page's own surface, dissolving as the word leaves — not a curtain. */}
      <motion.div
        className="absolute inset-0"
        style={{ background: "var(--intro-bg)" }}
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: FLY_AT, duration: 0.5, ease: "easeOut" }}
      />

      <div className="absolute inset-0 grid place-items-center">
        {/* The word. Outer element flies; inner rises out of the mask. */}
        <motion.div
          ref={wordRef}
          className="relative overflow-hidden font-semibold tracking-tight leading-tight text-zinc-900"
          style={{ fontSize: "clamp(64px, 11vw, 148px)", transformOrigin: "top left", willChange: "transform" }}
          initial={{ x: 0, y: 0, scale: 1 }}
          animate={flight ? { x: flight.x, y: flight.y, scale: flight.scale } : { opacity: 0 }}
          transition={{ delay: FLY_AT, duration: flight ? FLY_FOR : 0.25, ease: flight ? GLIDE : "easeOut" }}
          onAnimationComplete={finish}
        >
          <motion.div
            initial={{ y: "105%" }}
            animate={{ y: "0%" }}
            transition={{ duration: RISE, ease: EXPO }}
          >
            hola
          </motion.div>

          {/* A hairline that rules under the word as it rises, holds with it,
              then retracts — the retraction is the cue that it's about to
              leave. scaleX only, so it never touches layout. */}
          <motion.div
            className="absolute inset-x-0 bottom-[0.06em] h-px bg-current opacity-25"
            style={{ transformOrigin: "50% 50%" }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: [0, 1, 1, 0] }}
            transition={{ duration: FLY_AT, times: [0, 0.5, 0.72, 1], ease: EXPO }}
          />
        </motion.div>
      </div>
    </div>
  );
}
