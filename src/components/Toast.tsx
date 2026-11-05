// "Spotify deleted · Undo" toast with a 5-second countdown bar.
import { useUi } from "../ui/UiContext";
import { useIsDesktop } from "../ui/useIsDesktop";

export function Toast() {
  const { toastState, dismissToast } = useUi();
  const desk = useIsDesktop();
  if (!toastState) return null;

  return (
    <div
      key={toastState.id}
      role="status"
      className="fixed left-1/2 z-60 animate-rise overflow-hidden rounded-[14px] bg-inv text-invfg shadow-[0_20px_40px_-12px_rgba(0,0,0,0.5)]"
      style={{
        bottom: desk ? 28 : "calc(env(safe-area-inset-bottom, 0px) + 92px)",
        transform: "translateX(-50%)",
        width: "min(360px, calc(100% - 32px))",
      }}
    >
      <div className="flex h-12 items-center gap-3.5 pr-2 pl-4">
        <span className="flex-1 truncate text-sm">{toastState.text}</span>
        {toastState.undo && (
          <button
            type="button"
            onClick={() => {
              toastState.undo?.();
              dismissToast();
            }}
            className="h-[34px] rounded-[10px] border-none bg-[rgba(128,128,128,0.18)] px-3 text-sm font-semibold"
          >
            Undo
          </button>
        )}
      </div>
      <div className="h-0.5 origin-left bg-current opacity-35" style={{ animation: "shrink 5s linear forwards" }} />
    </div>
  );
}
