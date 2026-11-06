// Speeds up the first screen after opening the app.
//
// Before: the app asked "who am I?" (/api/auth/me), waited for the answer,
// and only then asked for subscriptions, totals and cards: two rounds of
// waiting, with a blank page throughout. When the backend is waking up
// (serverless cold start + the database resuming) each round can take
// seconds.
//
// Now, if this browser looks signed in, those three requests start at the
// same moment as /me, so there's one round of waiting instead of two. If the
// access token has expired, they all 401 together and share the single
// refresh in api/client.ts, then retry.
//
// "Looks signed in" = the csrf_token cookie exists. The backend sets it at
// login next to the httpOnly session cookies and clears it at logout, and,
// unlike those, JavaScript can read it. It's only a hint: if it's stale,
// /me still decides, and the prefetches just fail quietly.
import type { QueryClient } from "@tanstack/react-query";
import { readCookie } from "../api/client";
import { api } from "../api/endpoints";
import { keys } from "./queries";

export function looksSignedIn(): boolean {
  return readCookie("csrf_token") !== null;
}

/** Start the requests Home needs alongside /me. Errors are ignored (prefetchQuery never throws). */
export function prefetchStartup(qc: QueryClient): void {
  if (!looksSignedIn()) return;
  void qc.prefetchQuery({ queryKey: keys.subscriptions, queryFn: api.subscriptions });
  void qc.prefetchQuery({ queryKey: keys.summary, queryFn: api.summary });
  void qc.prefetchQuery({ queryKey: keys.paymentMethods, queryFn: () => api.paymentMethods() });
}
