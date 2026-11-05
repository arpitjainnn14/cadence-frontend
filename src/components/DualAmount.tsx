// A ₹ amount with any $ part on a quieter second line ("₹1,233" / "+ $30"),
// for small stat tiles where "₹1,233 + $30" wouldn't fit on one line.
import { inr } from "../lib/format";
import { usdText, type Dual } from "../lib/money";

export function DualAmount({ d }: { d: Dual }) {
  const showInr = d.inr > 0 || d.usd <= 0;
  return (
    <span className="flex flex-col">
      {showInr && <span>{inr(d.inr)}</span>}
      {d.usd > 0 && (
        <span className={showInr ? "text-[13px] font-medium tracking-normal text-fg2" : ""}>
          {showInr ? "+ " : ""}
          {usdText(d.usd)}
        </span>
      )}
    </span>
  );
}
