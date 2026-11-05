// The "odometer" number from the design: each digit is a vertical strip of
// 0–9 that slides to its value, rightmost digits first.
import { useEffect, useState } from "react";
import { groupINR } from "../lib/format";

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export function RollingNumber({ value }: { value: number }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOn(true), 60);
    return () => clearTimeout(t);
  }, []);

  const text = groupINR(value);
  const n = text.length;
  return (
    <span className="inline-flex h-[1em] items-start leading-none tabular-nums" aria-label={text}>
      {text.split("").map((ch, i) => {
        const fromRight = n - i; // stable keys so digits animate in place when the value changes
        if (!/\d/.test(ch)) {
          return (
            <span key={"s" + fromRight} className="inline-block" aria-hidden>
              {ch}
            </span>
          );
        }
        const d = on ? Number(ch) : 0;
        return (
          <span key={"d" + fromRight} className="inline-block h-[1em] overflow-hidden" aria-hidden>
            <span
              className="flex flex-col"
              style={{
                transform: `translateY(${-d}em)`,
                transition: `transform 1.1s cubic-bezier(.22,1.2,.36,1) ${fromRight * 45}ms`,
              }}
            >
              {DIGITS.map((x) => (
                <span key={x} className="h-[1em] leading-none">
                  {x}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}
