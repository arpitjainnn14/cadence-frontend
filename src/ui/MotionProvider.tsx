// framer-motion in "lazy mode": components use the small `m.*` elements, and
// the animation engine (motionFeatures.ts) is downloaded separately after the
// app starts. Until it arrives, things render in their final state without
// animating. `strict` makes any accidental `motion.*` usage throw in dev, so
// nothing quietly pulls the whole library back into the main bundle.
import { LazyMotion } from "framer-motion";
import type { ReactNode } from "react";

const loadFeatures = () => import("./motionFeatures").then((mod) => mod.default);

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      {children}
    </LazyMotion>
  );
}
