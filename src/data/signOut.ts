// Optimistic logout: the app forgets the session straight away and shows the
// Login screen, then tells the backend in the background. Waiting for the
// request made logout feel laggy, and its result doesn't change what the user
// should see: even if it fails, this device is signed out and the backend's
// session expires on its own.
//
// Order matters:
// 1. Cancel in-flight requests, so one can't come back with a 401 later and
//    show an error screen.
// 2. Set `me` to null while the app is still listening to it. <App> re-renders
//    and shows <Login> immediately. (Clearing the whole cache first removed
//    the `me` query out from under its observer, so the screen never changed.
//    That was the "logout lags, then 'Couldn't load this'" bug.)
// 3. Drop every other cached subscription, card and total.
import type { QueryClient } from "@tanstack/react-query";
import { keys } from "./queries";

let signedOutAt = 0;

/** True for a few seconds after signing out, so Login can confirm it. */
export function justSignedOut(): boolean {
  return Date.now() - signedOutAt < 15_000;
}

export function signOut(qc: QueryClient, sendLogout: () => Promise<unknown>): void {
  signedOutAt = Date.now();
  void qc.cancelQueries();
  qc.setQueryData(keys.me, null);
  qc.removeQueries({ predicate: (q) => q.queryKey[0] !== keys.me[0] });
  qc.getMutationCache().clear();
  // Start the next login from the home URL rather than whatever screen we were on.
  if (typeof window !== "undefined" && window.location.pathname !== "/") window.history.replaceState(null, "", "/");
  // Fire and forget: errors are ignored on purpose (see above).
  sendLogout().catch(() => undefined);
}
