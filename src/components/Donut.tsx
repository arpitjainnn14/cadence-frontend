// Donut chart drawn with SVG circles: each slice is the same circle with a
// dash pattern (stroke-dasharray) that only paints its share of the ring.
// No chart library needed, and it animates smoothly with CSS transitions.
import { groupINR } from "../lib/format";

export interface Slice {
  key: string;
  label: string;
  value: number;
  color: string;
}

interface Props {
  slices: Slice[];
  focus: string | null;
  onSelect: (key: string) => void;
  onHover: (key: string | null) => void;
  centerLabel: string;
  centerSub: string;
}

const R = 72;
const C = 2 * Math.PI * R;

export function Donut({ slices, focus, onSelect, onHover, centerLabel, centerSub }: Props) {
  const total = slices.reduce((a, s) => a + s.value, 0) || 1;
  const gap = slices.length > 1 ? 2.5 : 0;
  const focused = slices.find((s) => s.key === focus);
  let acc = 0;

  return (
    <div className="relative h-[188px] w-[188px] flex-none">
      <svg viewBox="0 0 188 188" className="h-[188px] w-[188px] -rotate-90 overflow-visible" fill="none">
        <circle cx="94" cy="94" r={R} stroke="var(--color-s2)" strokeWidth={18} />
        {slices.map((s) => {
          const len = (s.value / total) * C;
          const L = Math.max(len - gap, 0.5);
          const offset = -acc;
          acc += len;
          return (
            <circle
              key={s.key}
              cx="94"
              cy="94"
              r={R}
              role="button"
              aria-label={`${s.label}: ₹${groupINR(s.value)}`}
              onClick={() => onSelect(s.key)}
              onMouseEnter={() => onHover(s.key)}
              onMouseLeave={() => onHover(null)}
              className="cursor-pointer"
              style={{
                stroke: s.color,
                strokeWidth: focus === s.key ? 24 : 18,
                strokeDasharray: `${L} ${C - L}`,
                strokeDashoffset: offset,
                opacity: focus && focus !== s.key ? 0.3 : 1,
                transition:
                  "stroke-width .35s cubic-bezier(.3,1.4,.4,1), opacity .25s ease, stroke-dasharray .7s cubic-bezier(.32,.72,0,1), stroke-dashoffset .7s cubic-bezier(.32,.72,0,1)",
              }}
            />
          );
        })}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 px-[42px] text-center">
        <span className="max-w-full truncate text-xs text-fg2">{focused ? focused.label : centerLabel}</span>
        <span className="text-[25px] font-semibold tracking-[-0.04em] tabular-nums">₹{groupINR(focused ? focused.value : total)}</span>
        <span className="text-xs text-fg3">{focused ? `${Math.round((focused.value / total) * 100)}% of spend` : centerSub}</span>
      </div>
    </div>
  );
}
