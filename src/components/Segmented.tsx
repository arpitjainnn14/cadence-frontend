// Segmented control with the design's "liquid" highlight: when you move right,
// the right edge leads and the left edge catches up (and vice versa), so the
// pill stretches and settles instead of just sliding.
import { useRef, type ReactNode } from "react";

export interface SegOption<T extends string> {
  value: T;
  label: ReactNode;
}

interface Props<T extends string> {
  options: SegOption<T>[];
  value: T;
  onChange: (v: T) => void;
  /** "surface": on the page background. "inset": inside a sheet/card. */
  tone?: "surface" | "inset";
  height?: number;
  className?: string;
  buttonClassName?: string;
}

const PAD = 4;

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  tone = "surface",
  height = 34,
  className = "",
  buttonClassName = "",
}: Props<T>) {
  const n = options.length;
  const i = Math.max(0, options.findIndex((o) => o.value === value));

  // Remember the previous index to know which direction we moved.
  const prev = useRef({ i, dir: 0 });
  if (prev.current.i !== i) prev.current = { i, dir: i > prev.current.i ? 1 : -1 };
  const dir = prev.current.dir;

  const unit = `((100% - ${PAD * 2}px) / ${n})`;
  const lead = ".34s cubic-bezier(.3,1.3,.45,1)";
  const lag = ".62s cubic-bezier(.3,1.25,.4,1) .05s";
  const transition = dir > 0 ? `right ${lead}, left ${lag}` : dir < 0 ? `left ${lead}, right ${lag}` : "left .4s, right .4s";

  return (
    <div
      role="tablist"
      className={`relative grid rounded-xl p-1 ${tone === "surface" ? "bg-s1 shadow-lift" : "bg-s2"} ${className}`}
      style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
    >
      <div
        aria-hidden
        className={`absolute top-1 bottom-1 rounded-[9px] bg-s3 ${tone === "inset" ? "shadow-lift" : ""}`}
        style={{
          left: `calc(${PAD}px + ${i} * ${unit})`,
          right: `calc(${PAD}px + ${n - 1 - i} * ${unit})`,
          transition,
        }}
      />
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          type="button"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={`relative border-none bg-transparent text-[13px] font-medium whitespace-nowrap transition-colors duration-200 ${
            o.value === value ? "text-fg" : "text-fg2"
          } ${buttonClassName}`}
          style={{ height }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
