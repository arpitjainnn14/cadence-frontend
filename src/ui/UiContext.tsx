// App-wide UI state that isn't server data: which sheet is open, and the toast.
// Any screen can call `openSubscription()` / `openAddCard()` / `toast()`.
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import type { Subscription, SubscriptionIn } from "../api/types";

export type SheetState =
  | { kind: "subscription"; editing?: Subscription; preset?: Partial<SubscriptionIn> }
  | { kind: "card" }
  | null;

export interface ToastState {
  id: number;
  text: string;
  undo?: () => void;
}

interface Ui {
  sheet: SheetState;
  /** True during the 360ms slide-out, so the sheet can animate before unmounting. */
  closing: boolean;
  /** How far the sheet is being dragged down (px). The page behind uses it to un-shrink. */
  dragY: number;
  dragging: boolean;
  setDrag: (y: number, dragging: boolean) => void;
  openSubscription: (editing?: Subscription, preset?: Partial<SubscriptionIn>) => void;
  openAddCard: () => void;
  closeSheet: () => void;
  toastState: ToastState | null;
  toast: (text: string, undo?: () => void) => void;
  dismissToast: () => void;
}

const Ctx = createContext<Ui | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const [sheet, setSheet] = useState<SheetState>(null);
  const [closing, setClosing] = useState(false);
  const [drag, setDragState] = useState({ y: 0, dragging: false });
  const [toastState, setToast] = useState<ToastState | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const open = useCallback((s: SheetState) => {
    clearTimeout(closeTimer.current);
    setClosing(false);
    setDragState({ y: 0, dragging: false });
    setSheet(s);
  }, []);

  const closeSheet = useCallback(() => {
    setClosing(true);
    setDragState((d) => ({ ...d, dragging: false }));
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setSheet(null);
      setClosing(false);
      setDragState({ y: 0, dragging: false });
    }, 360);
  }, []);

  const toast = useCallback((text: string, undo?: () => void) => {
    clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), text, undo });
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }, []);

  const value = useMemo<Ui>(
    () => ({
      sheet,
      closing,
      dragY: drag.y,
      dragging: drag.dragging,
      setDrag: (y, dragging) => setDragState({ y, dragging }),
      openSubscription: (editing, preset) => open({ kind: "subscription", editing, preset }),
      openAddCard: () => open({ kind: "card" }),
      closeSheet,
      toastState,
      toast,
      dismissToast: () => {
        clearTimeout(toastTimer.current);
        setToast(null);
      },
    }),
    [sheet, closing, drag, open, closeSheet, toastState, toast],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUi(): Ui {
  const ui = useContext(Ctx);
  if (!ui) throw new Error("useUi must be used inside <UiProvider>");
  return ui;
}
