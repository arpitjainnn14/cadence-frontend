// What you see while the app checks your session on open (instead of a blank
// page): Home's outline with the real logo, name and title, and soft pulsing
// shapes where the wallet, budget and renewals will appear. Same sizes and
// spacing as Home, so nothing jumps when the real screen replaces it.
import { APP_NAME, AppTile } from "../brand";
import { longToday } from "../lib/format";
import { useIsDesktop } from "../ui/useIsDesktop";

const block = "animate-pulse rounded-[18px] bg-s1";

export function StartupSkeleton() {
  const desk = useIsDesktop();
  return (
    <div className="flex h-full w-full overflow-hidden bg-bg" aria-busy="true" aria-label="Loading Cadence">
      {desk && (
        <aside className="flex h-full w-[248px] flex-none flex-col gap-6 border-r border-hair px-3.5 pt-6">
          <div className="flex items-center gap-2.5 px-2">
            <AppTile size={30} />
            <span className="text-[17px] font-bold tracking-[-0.03em]">{APP_NAME}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className={`h-[42px] rounded-[10px] ${i === 0 ? "bg-s2" : ""}`} />
            ))}
          </div>
        </aside>
      )}

      <div className="relative min-w-0 flex-1 overflow-hidden">
        <div
          className="mx-auto flex flex-col gap-[22px]"
          style={
            desk
              ? { padding: "40px 48px 72px", maxWidth: 1120 }
              : { padding: "calc(env(safe-area-inset-top, 0px) + 14px) 20px 0", maxWidth: 640 }
          }
        >
          <div className="flex flex-col gap-0.5">
            <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-fg/70">
              {!desk && (
                <>
                  <AppTile size={16} />
                  <span className="font-semibold text-fg">{APP_NAME}</span>
                  <span aria-hidden>·</span>
                </>
              )}
              {longToday()}
            </span>
            <h1 className="m-0 text-[32px] leading-[1.15] font-bold tracking-[-0.035em]">Home</h1>
          </div>

          <div className={desk ? "grid grid-cols-2 items-start gap-8" : "flex flex-col gap-[22px]"}>
            <div className="flex flex-col items-center gap-4">
              {/* the wallet's 340×400 stage */}
              <div className={`${block} w-full max-w-[400px] rounded-[48px]`} style={{ aspectRatio: "340 / 400" }} />
              <div className={`${block} h-[88px] w-full max-w-[400px]`} />
            </div>
            <div className="flex flex-col gap-2.5">
              <div className="h-5 w-32 animate-pulse rounded-md bg-s1" />
              <div className={`${block} h-[264px]`} />
            </div>
          </div>
        </div>

        {!desk && (
          <div
            className="absolute right-0 bottom-0 left-0 flex items-center justify-center gap-2.5 px-[18px]"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)" }}
          >
            <div className="h-[60px] max-w-[288px] flex-1 rounded-[30px] bg-dock" />
            <div className="h-[60px] w-[60px] flex-none rounded-[30px] bg-s2" />
          </div>
        )}
      </div>
    </div>
  );
}
