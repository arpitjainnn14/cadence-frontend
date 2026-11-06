// The frame around every signed-in screen.
// Phone: content + floating glass dock with a "+" button.
// Laptop (≥900px): fixed sidebar on the left.
import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { AddCardSheet } from "../screens/AddCardSheet";
import { SubscriptionSheet } from "../screens/SubscriptionSheet";
import { Toast } from "../components/Toast";
import { CardIcon, GearIcon, HomeIcon, ListIcon, LogoutIcon, PieIcon, PlusIcon, ThemeIcon } from "../components/Icons";
import { useLogout, useMe } from "../data/queries";
import { useTheme } from "../ui/theme";
import { useUi } from "../ui/UiContext";
import { useIsDesktop } from "../ui/useIsDesktop";
import { APP_NAME, AppTile } from "../brand";

const TABS = [
  { to: "/", label: "Home", Icon: HomeIcon },
  { to: "/subscriptions", label: "Subscriptions", Icon: ListIcon },
  { to: "/insights", label: "Insights", Icon: PieIcon },
  { to: "/cards", label: "Cards", Icon: CardIcon },
] as const;

function useTabIndex(): number {
  const { pathname } = useLocation();
  if (pathname.startsWith("/subscriptions")) return 1;
  if (pathname.startsWith("/insights")) return 2;
  if (pathname.startsWith("/cards")) return 3;
  if (pathname.startsWith("/settings")) return 4;
  return 0;
}

export function AppShell() {
  const desk = useIsDesktop();
  const ui = useUi();
  const { pathname } = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);

  // New screen starts at the top.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  // iOS-style "page shrinks behind the sheet" effect (phones only).
  const sheetUp = !!ui.sheet && !ui.closing && !desk;
  const t = sheetUp ? Math.min(1, Math.max(0, ui.dragY) / 500) : 1;
  const scale = sheetUp ? 0.93 + 0.07 * t : 1;

  return (
    <div className="flex h-full w-full overflow-hidden" style={{ background: sheetUp ? "#000" : "var(--color-bg)", transition: "background .3s" }}>
      {desk && <Sidebar />}
      <div
        className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-bg"
        style={{
          transform: sheetUp ? `scale(${scale.toFixed(4)})` : "none",
          borderRadius: sheetUp ? 14 : 0,
          transformOrigin: "50% 40%",
          transition: ui.dragging ? "none" : "transform .5s cubic-bezier(.32,.72,0,1), border-radius .5s cubic-bezier(.32,.72,0,1)",
        }}
      >
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div
            className="mx-auto"
            style={
              desk
                ? { padding: "40px 48px 72px", maxWidth: 1120 }
                : {
                    padding: "calc(env(safe-area-inset-top, 0px) + 14px) 20px calc(env(safe-area-inset-bottom, 0px) + 104px)",
                    maxWidth: 640,
                  }
            }
          >
            <Outlet />
          </div>
        </div>
        {!desk && <Dock />}
      </div>

      {ui.sheet?.kind === "subscription" && (
        <SubscriptionSheet key={ui.sheet.editing?.id ?? "new"} editing={ui.sheet.editing} preset={ui.sheet.preset} />
      )}
      {ui.sheet?.kind === "card" && <AddCardSheet />}
      <Toast />
    </div>
  );
}

function Dock() {
  const navigate = useNavigate();
  const { openSubscription } = useUi();
  const ti = useTabIndex();
  return (
    <div
      className="pointer-events-none absolute right-0 bottom-0 left-0 z-20 flex items-center justify-center gap-2.5 px-[18px]"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)" }}
    >
      <nav
        aria-label="Main"
        // Liquid glass (index.css): frosted body, specular rim, depth.
        className="liquid-glass pointer-events-auto relative h-[60px] max-w-[288px] flex-1 rounded-[30px] p-[5px]"
      >
        <DockTabs index={ti} onPick={(i) => navigate(TABS[i].to)} />
      </nav>
      <button
        type="button"
        aria-label="New subscription"
        onClick={() => openSubscription()}
        className="glass-rim pointer-events-auto relative grid h-[60px] w-[60px] flex-none place-items-center rounded-[30px] border-none bg-inv text-invfg shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),inset_0_-2px_4px_rgba(0,0,0,0.25),0_12px_30px_-10px_rgba(0,0,0,0.6)] transition-transform duration-250 active:scale-[0.92]"
      >
        <PlusIcon size={24} />
      </button>
    </div>
  );
}

/**
 * Icon tabs with a glass pill that moves with the same "liquid" stretch as <Segmented>.
 *
 * Like the iOS tab bar, you can also press and slide: once your finger moves
 * a few pixels the pill grows slightly and follows it, snapping its highlight
 * to the tab underneath (with a light tick on phones that support vibration).
 * Letting go opens that tab. A plain tap works as before.
 */
function DockTabs({ index, onPick }: { index: number; onPick: (i: number) => void }) {
  const n = TABS.length;
  const unit = `((100% - 10px) / ${n})`;
  const prev = useRef({ i: index, dir: 0 });
  if (prev.current.i !== index) prev.current = { i: index, dir: index > prev.current.i ? 1 : -1 };
  const dir = prev.current.dir;
  const lead = ".34s cubic-bezier(.3,1.3,.45,1)";
  const lag = ".62s cubic-bezier(.3,1.25,.4,1) .05s";

  const gridRef = useRef<HTMLDivElement>(null);
  const press = useRef<{ id: number; x0: number; moved: boolean; lastX: number; lastT: number } | null>(null);
  const suppressClick = useRef(false);
  // `stretch` > 1 while the finger moves fast: the bubble elongates like liquid, then settles.
  const [drag, setDrag] = useState<{ x: number; w: number; hover: number; stretch: number } | null>(null);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tabAt = (x: number, w: number) => Math.min(n - 1, Math.max(0, Math.floor((x / w) * n)));

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    press.current = { id: e.pointerId, x0: e.clientX, moved: false, lastX: e.clientX, lastT: e.timeStamp };
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const p = press.current;
    const el = gridRef.current;
    if (!p || p.id !== e.pointerId || !el) return;
    if (!p.moved) {
      if (Math.abs(e.clientX - p.x0) < 6) return;
      p.moved = true;
      el.setPointerCapture(e.pointerId); // keep tracking even off the bar
    }
    const r = el.getBoundingClientRect();
    const x = Math.min(r.width, Math.max(0, e.clientX - r.left));
    const hover = tabAt(x, r.width);
    const speed = Math.abs(e.clientX - p.lastX) / Math.max(1, e.timeStamp - p.lastT); // px per ms
    p.lastX = e.clientX;
    p.lastT = e.timeStamp;
    const stretch = Math.min(1.28, 1 + speed * 0.18);
    setDrag((d) => {
      if (d && d.hover !== hover) navigator.vibrate?.(8);
      return { x, w: r.width, hover, stretch };
    });
    // Finger stopped: let the bubble round up again.
    if (settle.current) clearTimeout(settle.current);
    settle.current = setTimeout(() => setDrag((d) => (d ? { ...d, stretch: 1 } : d)), 90);
  }

  function onPointerEnd(e: React.PointerEvent<HTMLDivElement>) {
    const p = press.current;
    press.current = null;
    if (!p || p.id !== e.pointerId || !p.moved) return; // a tap: the button's onClick handles it
    suppressClick.current = true; // the click that follows a drag isn't a tap
    setTimeout(() => (suppressClick.current = false), 0);
    const d = drag;
    if (settle.current) clearTimeout(settle.current);
    setDrag(null);
    if (d && e.type === "pointerup" && d.hover !== index) onPick(d.hover);
  }

  // While dragging, the pill is centred under the finger (kept inside the bar).
  const pillW = drag ? drag.w / n : 0;
  const dragLeft = drag ? Math.min(drag.w - pillW, Math.max(0, drag.x - pillW / 2)) : 0;
  const showPill = !!drag || index < n; // hidden on Settings unless dragging
  const lit = drag ? drag.hover : index;

  return (
    <div
      ref={gridRef}
      className="relative grid h-full grid-cols-4 select-none"
      // Horizontal slides belong to us, not to the browser's page panning.
      style={{ touchAction: "pan-y" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      {showPill && (
        <div
          aria-hidden
          // A brighter liquid-glass lens inside the glass dock (without its own blur, see below).
          className="liquid-glass absolute top-0 bottom-0 rounded-[25px]"
          style={
            {
              "--lg-tint": "var(--lg-tint-strong)",
              // No second blur: the bubble sits on the already-frosted dock, so
              // its own backdrop blur was nearly invisible but doubled the
              // per-frame blur work, which made animations elsewhere on the
              // page (the Home wallet) stutter on iPhone. Tint, sheen, rim and
              // depth stay.
              backdropFilter: "none",
              WebkitBackdropFilter: "none",
              ...(drag
                ? {
                    left: dragLeft,
                    width: pillW,
                    // Lifted while held; stretched along the drag when moving fast.
                    transform: `scaleX(${(1.1 * drag.stretch).toFixed(3)}) scaleY(${(1.1 / Math.sqrt(drag.stretch)).toFixed(3)})`,
                    transition: "transform .22s cubic-bezier(.3,1.4,.45,1)",
                  }
                : {
                    left: `calc(${index} * ${unit})`,
                    right: `calc(${n - 1 - index} * ${unit})`,
                    transition: dir > 0 ? `right ${lead}, left ${lag}, transform .3s` : dir < 0 ? `left ${lead}, right ${lag}, transform .3s` : "left .4s, right .4s, transform .3s",
                  }),
            } as unknown as React.CSSProperties
          }
        />
      )}
      {TABS.map(({ to, label, Icon }, i) => (
        <button
          key={to}
          type="button"
          title={label}
          aria-label={label}
          aria-current={i === index ? "page" : undefined}
          onClick={() => {
            if (!suppressClick.current) onPick(i);
          }}
          className={`relative grid place-items-center border-none bg-transparent transition-[color,transform] duration-200 ${
            drag ? "" : "active:scale-[0.86]"
          } ${i === lit ? "text-fg" : "text-fg3"}`}
          style={drag && i === lit ? { transform: "scale(1.12)" } : undefined}
        >
          <Icon size={22} />
        </button>
      ))}
    </div>
  );
}

function Sidebar() {
  const { openSubscription } = useUi();
  const me = useMe();
  const logout = useLogout();
  const ti = useTabIndex();
  const { dark, toggle: toggleTheme } = useTheme();

  return (
    <aside className="flex h-full w-[248px] flex-none flex-col gap-6 border-r border-hair px-3.5 pt-6 pb-[18px]">
      <div className="flex items-center gap-2.5 px-2">
        <AppTile size={30} />
        <span className="text-[17px] font-bold tracking-[-0.03em]">{APP_NAME}</span>
        {/* Appearance: the design's round half-circle button (same as on the phone Home screen). */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={dark ? "Switch to light appearance" : "Switch to dark appearance"}
          title={dark ? "Switch to light appearance" : "Switch to dark appearance"}
          className="ml-auto grid h-8 w-8 place-items-center rounded-full border-none bg-s2 text-fg2 shadow-lift transition-[color,transform] duration-200 hover:text-fg active:scale-[0.92]"
        >
          <ThemeIcon size={16} style={{ transform: dark ? "none" : "rotate(180deg)", transition: "transform .45s cubic-bezier(.3,1.3,.4,1)" }} />
        </button>
      </div>

      <nav aria-label="Main" className="relative flex flex-col gap-0.5">
        <div
          aria-hidden
          className="absolute right-0 left-0 h-[42px] rounded-[10px] bg-s2 shadow-lift"
          style={{ top: ti * 44, transition: "top .42s cubic-bezier(.3,1.25,.4,1)" }}
        />
        {[...TABS, { to: "/settings", label: "Settings", Icon: GearIcon }].map(({ to, label, Icon }, i) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={`relative flex h-[42px] items-center gap-3 rounded-[10px] px-3 text-sm font-medium no-underline transition-colors duration-200 ${
              i === ti ? "text-fg" : "text-fg3 hover:text-fg2"
            }`}
          >
            <Icon size={19} />
            {label}
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        onClick={() => openSubscription()}
        className="flex h-10 items-center justify-center gap-[7px] rounded-[10px] border-none bg-inv text-sm font-semibold text-invfg transition-transform duration-150 active:scale-[0.97]"
      >
        <PlusIcon size={16} />
        New subscription
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-2.5 border-t border-hair px-2 pt-3.5">
        <div className="grid h-8 w-8 place-items-center rounded-full bg-s3 text-xs font-semibold text-fg2 uppercase">
          {me.data?.email.slice(0, 2) ?? ""}
        </div>
        <span className="min-w-0 flex-1 truncate text-[13px] text-fg2">{me.data?.email}</span>
        <button
          type="button"
          title="Sign out"
          aria-label="Sign out"
          onClick={logout}
          className="grid h-8 w-8 place-items-center rounded-lg border-none bg-transparent text-fg3 hover:text-fg2"
        >
          <LogoutIcon size={17} />
        </button>
      </div>
    </aside>
  );
}
