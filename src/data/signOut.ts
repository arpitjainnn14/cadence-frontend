// Optimistic logout: the app forgets the session straight away and shows the
// Login screen, then tells the backend in the background. Waiting for the
// request made logout feel laggy, and its result doesn't change what the user
// should see: even if it fails, this device is signed out and the backend's
// session expires on its own.
import type { QueryClient } from "@tanstack/react-query";
import { keys } from "./queries";

export function signOut(qc: QueryClient, sendLogout: () => Promise<unknown>): void {
  qc.clear(); // drop every cached subscription, card and total
  qc.setQueryData(keys.me, null); // `me = null` makes <App> render <Login>
  // Start the next login from the home URL rather than whatever screen we were on.
  if (typeof window !== "undefined" && window.location.pathname !== "/") window.history.replaceState(null, "", "/");
  // Fire and forget: errors are ignored on purpose (see above).
  sendLogout().catch(() => undefined);
}
