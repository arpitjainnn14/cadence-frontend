// The app's name and logo in one place. Rename the app here (plus index.html,
// public/manifest.webmanifest and public/sw.js, which can't import this).
export const APP_NAME = "Cadence";
export const TAGLINE = "Every subscription, in rhythm.";

/**
 * The Cadence logo, direction 1b ("Renewal ring") from Logo.dc.html: a billing
 * cycle that's almost closed, with an amber dot in the gap for the next
 * renewal (the same amber as "due soon" in the app).
 *
 * Drawn with theme colours, so it matches the design's dark tile in dark mode
 * and its light tile in light mode. Below 40px it uses the design's thicker
 * small-size version so it stays readable. The PWA icons and favicon are
 * generated from the same shapes (scripts/make-icons.mjs, public/favicon.svg).
 */
export function AppTile({ size, className = "" }: { size: number; className?: string }) {
  const small = size < 40;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={`flex-none ${className}`} aria-hidden>
      <rect width="120" height="120" rx="27" fill="var(--color-bg)" />
      <rect x="0.5" y="0.5" width="119" height="119" rx="26.5" fill="none" stroke="var(--color-hair2)" />
      {small ? (
        <>
          <path d="M60 28 A32 32 0 1 1 32 44" fill="none" stroke="var(--color-fg)" strokeWidth={15} strokeLinecap="round" />
          <circle cx="44" cy="31" r="9" fill="var(--logo-dot)" />
        </>
      ) : (
        <>
          <path d="M60 30 A30 30 0 1 1 33.5 46" fill="none" stroke="var(--color-fg)" strokeWidth={11} strokeLinecap="round" />
          <circle cx="44" cy="33.5" r="7" fill="var(--logo-dot)" />
        </>
      )}
    </svg>
  );
}
