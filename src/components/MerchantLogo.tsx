// Merchant tile. The real logo the backend found (`logo_url`) wins whenever
// there is one. Otherwise, and while the logo is loading or if it fails, we
// show a letter tile: brand-coloured for merchants on our built-in list
// (lib/brands.ts, from the design), neutral for everything else.
import { useState } from "react";
import { findBrand } from "../lib/brands";

interface Props {
  name: string;
  logoUrl?: string | null;
  size?: number;
  radius?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function MerchantLogo({ name, logoUrl, size = 42, radius = 12, className = "", style }: Props) {
  // Load state belongs to one URL. It's reset during render when the URL
  // changes (not in an effect: a cached logo can finish loading before an
  // effect runs, and the reset would then hide it for good).
  const [state, setState] = useState({ url: logoUrl, loaded: false, broken: false });
  if (state.url !== logoUrl) setState({ url: logoUrl, loaded: false, broken: false });
  const loaded = state.url === logoUrl && state.loaded;
  const broken = state.url === logoUrl && state.broken;
  const markLoaded = () => setState((st) => (st.url === logoUrl ? { ...st, loaded: true } : st));
  const markBroken = () => setState((st) => (st.url === logoUrl ? { ...st, broken: true } : st));

  const brand = findBrand(name);
  const letter = brand?.mark ?? (name.trim()[0]?.toUpperCase() || "");
  const tryImg = !!logoUrl && !broken;
  const showImg = tryImg && loaded;
  // The logo image is layered over the letter, so the tile must be positioned.
  // Keep the caller's position (e.g. `absolute` inside the merchant field);
  // adding `relative` too would override it and push the tile out of place.
  const positioned = /(^|\s)(absolute|fixed|sticky)(\s|$)/.test(className) ? "" : "relative";

  return (
    <div
      className={`${positioned} grid flex-none place-items-center overflow-hidden font-bold tracking-[-0.03em] ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        // Logos sit on white (favicons are made for light backgrounds).
        background: showImg ? "#fff" : (brand?.bg ?? (name ? "var(--color-s3)" : "var(--color-s2)")),
        color: brand?.fg ?? "var(--color-fg2)",
        fontSize: Math.round(size * 0.4),
        // A hairline edge so a white logo tile still reads as a tile on white lists (light theme).
        boxShadow: showImg ? "inset 0 0 0 1px var(--color-hair2)" : undefined,
        transition: "background-color .2s",
        ...style,
      }}
    >
      {!showImg && letter}
      {tryImg && (
        // Small inset so square favicons don't touch the rounded corners.
        <img
          src={logoUrl!}
          alt=""
          draggable={false}
          // An image already in the cache may be complete before onLoad is attached.
          ref={(img) => {
            if (img?.complete && img.naturalWidth > 0 && !loaded) markLoaded();
          }}
          onLoad={markLoaded}
          onError={markBroken}
          className="absolute object-contain"
          style={{
            inset: Math.round(size * 0.14),
            width: `calc(100% - ${2 * Math.round(size * 0.14)}px)`,
            height: `calc(100% - ${2 * Math.round(size * 0.14)}px)`,
            opacity: loaded ? 1 : 0,
            transition: "opacity .2s",
          }}
        />
      )}
    </div>
  );
}
