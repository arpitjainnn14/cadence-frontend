import { useSyncExternalStore } from "react";

// The design switches from the phone layout (bottom dock, bottom sheets) to
// the laptop layout (sidebar, centred dialogs) at 900px.
const QUERY = "(min-width: 900px)";

export function useIsDesktop(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(QUERY);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(QUERY).matches,
  );
}
