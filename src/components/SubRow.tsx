// One subscription row (SubRow.dc.html). Used on Home, Subscriptions and Card detail.
import { CardThumb } from "./CardArt";
import { MerchantLogo } from "./MerchantLogo";

export interface SubRowProps {
  name: string;
  logoUrl?: string | null;
  /** Second line, e.g. "in 2 days · 6 Nov" or "ICICI Sapphiro". */
  sub: string;
  /** Highlight the second line (renewing within 7 days). */
  soon?: boolean;
  /** Show the little orange dot before the second line. */
  dot?: boolean;
  price: string;
  cycle: string;
  /** Small text under the price, e.g. "₹7,788/yr" or "$240/yr". */
  right2?: string;
  thumb?: string;
  thumbTitle?: string;
  /** Paused / Cancelled badge; also dims the logo. */
  statusLabel?: string;
  divider?: boolean;
  onClick?: () => void;
}

export function SubRow(r: SubRowProps) {
  return (
    <button
      type="button"
      onClick={r.onClick}
      className="relative flex w-full items-center gap-3.5 border-none bg-transparent px-4 py-3 text-left text-fg transition-[background,transform] duration-150 hover:bg-s2 active:scale-[0.985] active:bg-s2"
      style={{ transitionTimingFunction: "cubic-bezier(.3,1.5,.4,1)" }}
    >
      {r.divider && <div className="absolute top-0 right-0 left-[72px] h-px bg-hair" />}
      <MerchantLogo name={r.name} logoUrl={r.logoUrl} style={{ opacity: r.statusLabel ? 0.5 : 1 }} />

      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-base font-medium tracking-[-0.01em]">{r.name}</span>
          {r.statusLabel && (
            <span className="flex-none rounded-full bg-s3 px-[7px] py-0.5 text-[11px] font-medium text-fg2">{r.statusLabel}</span>
          )}
        </div>
        <div className="flex min-w-0 items-center gap-1.5">
          {r.dot && <span className="h-1.5 w-1.5 flex-none rounded-full bg-warn" />}
          <span className={`truncate text-[13.5px] ${r.soon ? "text-warn" : "text-fg2"}`}>{r.sub}</span>
        </div>
      </div>

      <div className="flex flex-none flex-col items-end gap-[5px]">
        <span className="text-base font-semibold tracking-[-0.01em] whitespace-nowrap tabular-nums">
          {r.price}
          <span className="text-[13px] font-normal text-fg3">{r.cycle}</span>
        </span>
        <div className="flex items-center gap-1.5">
          {r.right2 && <span className="text-[12.5px] whitespace-nowrap text-fg3 tabular-nums">{r.right2}</span>}
          {r.thumb && <CardThumb bg={r.thumb} title={r.thumbTitle} />}
        </div>
      </div>
    </button>
  );
}

/** The rounded surface that groups rows. */
export function RowGroup({ children }: { children: React.ReactNode }) {
  return <div className="overflow-hidden rounded-[18px] bg-s1 shadow-lift">{children}</div>;
}
