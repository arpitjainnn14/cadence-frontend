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
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { IntroLoader } from "../components/ui/intro-loader";

const MIN_MS = 900;

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
          className="fixed inset-0 z-[100]"
          exit={{ opacity: 0, scale: 1.02, filter: "blur(12px)" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <IntroLoader
            key={round}
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
