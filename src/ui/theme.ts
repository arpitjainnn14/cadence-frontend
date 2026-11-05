// Light / dark appearance.
//
// The theme is the `data-theme` attribute on <html> ("light" | "dark"); the
// CSS in index.css swaps every colour variable based on it. A tiny script in
// index.html sets it before first paint. Until you pick one we follow the
// phone's setting; once you toggle, your choice is saved in localStorage
// (a harmless UI preference, nothing to do with login).
import { useEffect, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";
const KEY = "subs-theme";
const listeners = new Set<() => void>();

function saved(): Theme | null {
  try {
    const t = localStorage.getItem(KEY);
    return t === "light" || t === "dark" ? t : null;
  } catch {
    return null; // private mode etc.
  }
}

function system(): Theme {
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function currentTheme(): Theme {
  return (document.documentElement.dataset.theme as Theme) || "dark";
}

function apply(t: Theme) {
  document.documentElement.dataset.theme = t;
  // Status bar / browser chrome colour on phones.
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", t === "light" ? "#F3F3F1" : "#050505");
  listeners.forEach((l) => l());
}

export function setTheme(t: Theme) {
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* still switch for this session */
  }
  apply(t);
}

export function useTheme() {
  const theme = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    currentTheme,
  );

  // Follow the phone's setting live, unless the user picked one.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => !saved() && apply(system());
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return {
    theme,
    dark: theme === "dark",
    toggle: () => setTheme(theme === "dark" ? "light" : "dark"),
  };
}
