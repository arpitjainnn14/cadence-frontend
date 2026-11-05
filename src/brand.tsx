// The app's name and logo in one place. Rename the app here (plus index.html,
// public/manifest.webmanifest and public/sw.js, which can't import this).
export const APP_NAME = "Cadence";
export const TAGLINE = "Every subscription, in rhythm.";

/**
 * The Cadence mark: an open ring (a billing cycle that keeps coming back
 * around) with a single beat in the gap. Drawn in currentColor so it works on
 * any background. The app icon (scripts/make-icons.mjs) draws the same shape.
 */
export function AppMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="1 0 24 24" aria-hidden fill="none">
      <path d="M16.95 7.05A7 7 0 1 0 16.95 16.95" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" />
      <circle cx="19.3" cy="12" r="1.7" fill="currentColor" />
    </svg>
  );
}

/** The mark on a rounded tile, as used on the login screen and in the sidebar. */
export function AppTile({ size, radius, className = "" }: { size: number; radius: number; className?: string }) {
  return (
    <div
      className={`grid flex-none place-items-center bg-inv text-invfg ${className}`}
      style={{ width: size, height: size, borderRadius: radius }}
    >
      <AppMark size={Math.round(size * 0.62)} />
    </div>
  );
}
