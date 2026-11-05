import type { ReactNode } from "react";

/** Small grey line above a big title, with optional actions on the right. */
export function ScreenHeader({ eyebrow, title, right }: { eyebrow: ReactNode; title: string; right?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-[13px] font-medium text-fg2">{eyebrow}</span>
        <h1 className="m-0 text-[32px] leading-[1.15] font-bold tracking-[-0.035em]">{title}</h1>
      </div>
      {right}
    </div>
  );
}

/** Section title row ("Due this week ............ ₹768"). */
export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between px-1">
      <span className="text-[15px] font-semibold tracking-[-0.01em]">{children}</span>
      {right}
    </div>
  );
}

/** Quiet placeholder while the first fetch is in flight. */
export function Loading() {
  return <div className="h-40 animate-pulse rounded-[18px] bg-s1" aria-label="Loading" />;
}

/** Shown when a request fails for a reason other than auth. */
export function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-14 text-center">
      <span className="text-[15px] text-fg2">Couldn't load this. Check your connection.</span>
      <button type="button" onClick={onRetry} className="h-[34px] rounded-[17px] border-none bg-s2 px-3.5 text-[13px] text-fg">
        Try again
      </button>
    </div>
  );
}
