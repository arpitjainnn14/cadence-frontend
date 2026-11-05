import { useCallback, useRef, useState } from "react";

/**
 * Measures an element's width and keeps it updated (used to overlap the card stack).
 * Returns a *callback ref*, so it works even if the element appears later
 * (for example after data finishes loading).
 */
export function useWidth<T extends HTMLElement>() {
  const [width, setWidth] = useState(0);
  const observer = useRef<ResizeObserver | null>(null);
  const ref = useCallback((el: T | null) => {
    observer.current?.disconnect();
    observer.current = null;
    if (!el) return;
    observer.current = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.current.observe(el);
  }, []);
  return [ref, width] as const;
}
