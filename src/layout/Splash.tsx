// The opening splash: easyui's IntroLoader ("Hello", "Hola", "Bonjour"...)
// shown while the app finds out whether you're signed in and loads Home's
// data. Used as a loading screen:
//
// - It shows for at least MIN_MS so a fast load doesn't flash it, and goes
//   away as soon as the app is ready after that (fading and blurring out).
// - If the greetings finish before the app is ready (backend waking up), they
//   play again.
// - No progress bar (we can't know how long the backend will take) and no
//   Skip (underneath is only the loading outline).
// - Once per app open: after it leaves it never comes back, e.g. on sign out.
// - With "reduce motion" it isn't shown; the plain loading outline is.
// - Liquid-glass depth: pastel blobs in the card colours drift behind a
//   frosted glass pane (index.css `liquid-glass`), and the greeting sits on
//   the glass. IntroLoader's own background is made transparent for this.
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { IntroLoader } from "../components/ui/intro-loader";

const MIN_MS = 900;

// Card pastels (lib/cardStyle.ts), each anchored at its own spot around the
// pane (x, y from the centre) so the colours stay distinct as they drift.
const BLOBS = [
  { color: "#b3c6f2", size: 180, x: -95, y: -75, anim: "driftA", dur: 7 }, // HDFC blue
  { color: "#f2b1b8", size: 160, x: 100, y: -65, anim: "driftB", dur: 8.5 }, // IDFC pink
  { color: "#a6dccd", size: 150, x: -70, y: 5, anim: "driftC", dur: 6.5 }, // Scapia teal
  { color: "#f6d59a", size: 130, x: 70, y: 10, anim: "driftA", dur: 9.5 }, // Amazon Pay amber
];

export function Splash({ ready }: { ready: boolean }) {
  const reduce = useReducedMotion();
  const [round, setRound] = useState(0);
  const [minDone, setMinDone] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinDone(true), MIN_MS);
    return () => clearTimeout(t);
  }, []);

  // Latch: once it has left, stay gone.
  const leaving = ready && minDone;
  useEffect(() => {
    if (leaving) setGone(true);
  }, [leaving]);

  const show = !reduce && !gone && !leaving;
  // Must be stable: IntroLoader restarts its greetings whenever onComplete changes.
  const again = useCallback(() => setRound((r) => r + 1), []);

  return (
    <AnimatePresence>
      {show && (
        <m.div
          key="splash"
          className="fixed inset-0 z-[100] overflow-hidden bg-bg"
          exit={{ opacity: 0, scale: 1.02, filter: "blur(12px)" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Colour behind the glass: soft pastel blobs drifting slowly around the centre. */}
          <div aria-hidden className="absolute top-1/2 left-1/2">
            {BLOBS.map((b) => (
              <span
                key={b.color}
                className="absolute rounded-full"
                style={{
                  left: b.x,
                  top: b.y,
                  width: b.size,
                  height: b.size,
                  background: b.color,
                  filter: "blur(30px)",
                  opacity: 0.65,
                  animation: `${b.anim} ${b.dur}s ease-in-out infinite alternate`,
                }}
              />
            ))}
          </div>
          {/* The glass pane the greeting sits on. */}
          <m.div
            aria-hidden
            className="liquid-glass absolute top-1/2 left-1/2 h-[128px] w-[min(300px,80vw)] -translate-x-1/2 -translate-y-1/2 rounded-[40px]"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", duration: 0.7, bounce: 0.3 }}
          />
          <IntroLoader
            key={round}
            className="bg-transparent"
            showProgress={false}
            allowSkip={false}
            // Finished before the app is ready: go round again.
            onComplete={again}
          />
        </m.div>
      )}
    </AnimatePresence>
  );
}
