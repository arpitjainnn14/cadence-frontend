// Merchant tile. The real logo the backend found (`logo_url`) wins whenever
// there is one. Otherwise, and while the logo is loading or if it fails, we
// show a letter tile: brand-coloured for merchants on our built-in list
// (lib/brands.ts, from the design), neutral for everything else.
import { useEffect, useState } from "react";
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
  const [loaded, setLoaded] = useState(false);
  const [broken, setBroken] = useState(false);
  useEffect(() => {
    setLoaded(false);
    setBroken(false);
  }, [logoUrl]);

  const brand = findBrand(name);
  const letter = brand?.mark ?? (name.trim()[0]?.toUpperCase() || "");
  const tryImg = !!logoUrl && !broken;
  const showImg = tryImg && loaded;

  return (
    <div
      className={`relative grid flex-none place-items-center overflow-hidden font-bold tracking-[-0.03em] ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        // Logos sit on white (favicons are made for light backgrounds).
        background: showImg ? "#fff" : (brand?.bg ?? (name ? "var(--color-s3)" : "var(--color-s2)")),
        color: brand?.fg ?? "var(--color-fg2)",
        fontSize: Math.round(size * 0.4),
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
          onLoad={() => setLoaded(true)}
          onError={() => setBroken(true)}
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
