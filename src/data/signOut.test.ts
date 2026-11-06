import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { keys } from "./queries";
import { signOut } from "./signOut";

describe("signOut (optimistic logout)", () => {
  it("tells whatever is watching `me` that we're signed out, so Login shows straight away", () => {
    // Regression: clearing the whole cache first detached the app's `me`
    // observer, so the screen never switched to Login.
    const qc = new QueryClient();
    qc.setQueryData(keys.me, { email: "a@b.test" });
    const observer = new QueryObserver(qc, { queryKey: keys.me, queryFn: () => new Promise(() => {}), staleTime: Infinity });
    const seen: unknown[] = [];
    const unsubscribe = observer.subscribe((r) => seen.push(r.data));

    signOut(qc, () => new Promise<void>(() => {}));

    expect(seen).toContain(null); // the observer was notified
    expect(observer.getCurrentResult().data).toBeNull();
    unsubscribe();
  });

  it("stops in-flight requests so they can't fail later and show an error screen", async () => {
    const qc = new QueryClient();
    let aborted = false;
    const observer = new QueryObserver(qc, {
      queryKey: keys.summary,
      queryFn: ({ signal }) =>
        new Promise((_, reject) => signal.addEventListener("abort", () => ((aborted = true), reject(new Error("aborted"))))),
    });
    const unsubscribe = observer.subscribe(() => {});
    await new Promise((r) => setTimeout(r, 0));

    signOut(qc, () => Promise.resolve());
    await new Promise((r) => setTimeout(r, 0));

    expect(aborted).toBe(true);
    unsubscribe();
  });

  it("clears the session immediately, before the logout request finishes", () => {
    const qc = new QueryClient();
    qc.setQueryData(keys.me, { email: "a@b.test" });
    qc.setQueryData(keys.subscriptions, [{ id: "1" }]);
    const sendLogout = vi.fn(() => new Promise<void>(() => {})); // never resolves

    signOut(qc, sendLogout);

    expect(sendLogout).toHaveBeenCalledTimes(1);
    expect(qc.getQueryData(keys.me)).toBeNull(); // → the Login screen shows
    expect(qc.getQueryData(keys.subscriptions)).toBeUndefined(); // no data left behind
  });

  it("ignores a failed logout request", async () => {
    const qc = new QueryClient();
    const sendLogout = vi.fn(() => Promise.reject(new Error("offline")));
    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);

    signOut(qc, sendLogout);
    await new Promise((r) => setTimeout(r, 0));

    process.off("unhandledRejection", unhandled);
    expect(unhandled).not.toHaveBeenCalled();
    expect(qc.getQueryData(keys.me)).toBeNull();
  });
});
