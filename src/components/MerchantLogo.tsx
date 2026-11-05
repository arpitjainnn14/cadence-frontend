// Merchant tile. The design uses brand-coloured letter tiles, so known brands
// (our built-in list) always get those. Other merchants show the logo the
// backend found, falling back to a neutral letter.
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
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [logoUrl]);

  const brand = findBrand(name);
  const letter = brand?.mark ?? (name.trim()[0]?.toUpperCase() || "");
  const showImg = !brand && !!logoUrl && !broken;

  return (
    <div
      className={`grid flex-none place-items-center overflow-hidden font-bold tracking-[-0.03em] ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: showImg ? "#fff" : (brand?.bg ?? (name ? "var(--color-s3)" : "var(--color-s2)")),
        color: brand?.fg ?? "var(--color-fg2)",
        fontSize: Math.round(size * 0.4),
        ...style,
      }}
    >
      {showImg ? (
        <img src={logoUrl!} alt="" className="h-full w-full object-cover" onError={() => setBroken(true)} />
      ) : (
        letter
      )}
    </div>
  );
}
