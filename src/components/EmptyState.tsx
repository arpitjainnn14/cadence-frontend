import { QUICK_ADD, findBrand } from "../lib/brands";
import { useUi } from "../ui/UiContext";
import { PlusIcon } from "./Icons";
import { APP_NAME } from "../brand";

/** Shown on Home / Subscriptions / Insights when there are no subscriptions yet. */
export function EmptyState() {
  const { openSubscription } = useUi();
  return (
    <div className="flex animate-screen-in flex-col items-center gap-6 px-2 pt-14 pb-6 text-center">
      <div className="relative h-[84px] w-[132px]">
        <div className="absolute top-3.5 left-0 h-[66px] w-[104px] -rotate-[8deg] rounded-xl bg-s2 shadow-lift" />
        <div className="absolute top-0 right-0 grid h-[66px] w-[104px] rotate-6 place-items-center rounded-xl bg-s3 shadow-[inset_0_1px_0_rgba(255,255,255,0.045),0_14px_30px_-14px_rgba(0,0,0,0.6)]">
          <PlusIcon size={22} className="text-fg2" weight={2} />
        </div>
      </div>
      <div className="flex max-w-[310px] flex-col gap-2">
        <h2 className="m-0 text-[22px] font-bold tracking-[-0.03em]">No subscriptions yet</h2>
        <p className="m-0 text-[15px] leading-[1.45] text-pretty text-fg2">
          Add what you pay for and {APP_NAME} will total it up and remind you before each renewal.
        </p>
      </div>
      <button
        type="button"
        onClick={() => openSubscription()}
        className="h-[46px] rounded-[23px] border-none bg-inv px-5 text-[15px] font-semibold text-invfg"
      >
        Add a subscription
      </button>
      <div className="flex flex-col items-center gap-2.5 pt-2">
        <span className="text-[13px] text-fg3">Or start with one of these</span>
        <div className="flex max-w-[360px] flex-wrap justify-center gap-2">
          {QUICK_ADD.map((name) => {
            const b = findBrand(name)!;
            return (
              <button
                key={name}
                type="button"
                onClick={() => openSubscription(undefined, { merchant_name: name, category: b.category })}
                className="flex h-9 items-center gap-2 rounded-[18px] border-none bg-s2 pr-3 pl-1.5 text-[13px] font-medium text-fg"
              >
                <span className="grid h-6 w-6 place-items-center rounded-[7px] text-[11px] font-bold" style={{ background: b.bg, color: b.fg }}>
                  {b.mark}
                </span>
                {name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
