// Bottom sheet on phones (drag the header down to dismiss), centred dialog on laptops.
import { useEffect, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { useUi } from "../ui/UiContext";
import { useIsDesktop } from "../ui/useIsDesktop";

interface Props {
  title: string;
  children: ReactNode;
  footer: ReactNode;
}

export function Sheet({ title, children, footer }: Props) {
  const { closing, closeSheet, dragY, dragging, setDrag } = useUi();
  const desk = useIsDesktop();

  // Escape closes the sheet (handy on laptops).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeSheet();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeSheet]);

  function onGrab(e: ReactPointerEvent) {
    if (desk || (e.target as HTMLElement).closest("button")) return;
    const y0 = e.clientY;
    let lastY = y0;
    let lastT = performance.now();
    let velocity = 0;
    let current = 0;
    setDrag(0, true);

    const move = (ev: PointerEvent) => {
      const now = performance.now();
      const dy = ev.clientY - y0;
      velocity = (ev.clientY - lastY) / Math.max(1, now - lastT);
      lastY = ev.clientY;
      lastT = now;
      // Down follows the finger; up resists (rubber band).
      current = dy > 0 ? dy : -Math.sqrt(-dy) * 2.5;
      setDrag(current, true);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      if (current > 120 || velocity > 0.55) closeSheet();
      else setDrag(0, false);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  }

  const panelStyle: React.CSSProperties = desk
    ? {
        left: "50%",
        top: "50%",
        transform: "translate(-50%,-50%)",
        width: "min(540px, calc(100% - 48px))",
        maxHeight: "88%",
        borderRadius: 22,
        boxShadow: "0 0 0 1px var(--color-hair2), 0 40px 80px -20px rgba(0,0,0,0.6)",
        animation: "var(--animate-settle)",
        opacity: closing ? 0 : 1,
        transition: "opacity .25s ease",
      }
    : {
        left: 0,
        right: 0,
        bottom: 0,
        top: "calc(env(safe-area-inset-top, 0px) + 10px)",
        borderRadius: "26px 26px 0 0",
        boxShadow: "0 -1px 0 var(--color-hair2), 0 -20px 50px -20px rgba(0,0,0,0.6)",
        transform: closing ? "translateY(100%)" : `translateY(${dragY}px)`,
        transition: dragging ? "none" : "transform .5s cubic-bezier(.32,.72,0,1)",
        animation: "var(--animate-sheet-up)",
      };

  return (
    <>
      <div
        onClick={closeSheet}
        className="fixed inset-0 z-40 animate-fade-in bg-black/50"
        style={{ opacity: closing ? 0 : 1, transition: "opacity .34s ease" }}
      />
      <div role="dialog" aria-modal aria-label={title} className="fixed z-41 flex flex-col overflow-hidden bg-s1" style={panelStyle}>
        <div onPointerDown={onGrab} className="flex-none touch-none px-5 pt-2" style={{ cursor: desk ? "default" : "grab" }}>
          {!desk && <div className="mx-auto mb-1.5 h-[5px] w-[38px] rounded-[3px] bg-hair2" />}
          <div className="grid h-[46px] grid-cols-[72px_1fr_72px] items-center">
            <button type="button" onClick={closeSheet} className="justify-self-start border-none bg-transparent p-0 text-[15px] text-fg2">
              Cancel
            </button>
            <span className="text-center text-base font-semibold tracking-[-0.01em]">{title}</span>
            <span />
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-[22px] overflow-y-auto px-5 pt-2.5 pb-6">{children}</div>
        <div
          className="flex-none border-t border-hair px-5 pt-3"
          style={{ paddingBottom: desk ? 16 : "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
        >
          {footer}
        </div>
      </div>
    </>
  );
}

/** Field label used in forms. */
export function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="text-[13px] font-medium text-fg2">{children}</span>;
}

/** Full-width primary button (sheet footers, login). */
export function PrimaryButton({
  children,
  disabled,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      disabled={disabled}
      className={`h-[52px] w-full rounded-[14px] border-none bg-inv text-base font-semibold text-invfg transition-transform duration-150 active:scale-[0.98] disabled:opacity-60 ${rest.className ?? ""}`}
    >
      {children}
    </button>
  );
}
