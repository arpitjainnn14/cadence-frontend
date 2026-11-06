import { QueryClient } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/endpoints";
import { keys } from "./queries";
import { looksSignedIn, prefetchStartup } from "./startup";

const setCsrf = (on: boolean) => {
  document.cookie = on ? "csrf_token=abc; path=/" : "csrf_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
};

afterEach(() => {
  setCsrf(false);
  vi.restoreAllMocks();
});

describe("startup prefetch", () => {
  it("uses the readable csrf_token cookie as the 'signed in' hint", () => {
    expect(looksSignedIn()).toBe(false);
    setCsrf(true);
    expect(looksSignedIn()).toBe(true);
  });

  it("starts Home's three requests straight away when signed in", () => {
    setCsrf(true);
    const subs = vi.spyOn(api, "subscriptions").mockResolvedValue([]);
    const summary = vi.spyOn(api, "summary").mockReturnValue(new Promise(() => {}));
    const pms = vi.spyOn(api, "paymentMethods").mockResolvedValue([]);
    const qc = new QueryClient();

    prefetchStartup(qc);

    // Called synchronously, i.e. at the same moment as /me, not after it.
    expect(subs).toHaveBeenCalledTimes(1);
    expect(summary).toHaveBeenCalledTimes(1);
    expect(pms).toHaveBeenCalledTimes(1);
    expect(qc.getQueryState(keys.summary)?.fetchStatus).toBe("fetching");
  });

  it("sends nothing for a signed-out visitor", () => {
    const subs = vi.spyOn(api, "subscriptions").mockResolvedValue([]);
    prefetchStartup(new QueryClient());
    expect(subs).not.toHaveBeenCalled();
  });

  it("doesn't throw when a prefetch fails (e.g. the session expired)", async () => {
    setCsrf(true);
    vi.spyOn(api, "subscriptions").mockRejectedValue(new Error("401"));
    vi.spyOn(api, "summary").mockRejectedValue(new Error("401"));
    vi.spyOn(api, "paymentMethods").mockRejectedValue(new Error("401"));
    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);
    prefetchStartup(new QueryClient({ defaultOptions: { queries: { retry: false } } }));
    await new Promise((r) => setTimeout(r, 10));
    process.off("unhandledRejection", unhandled);
    expect(unhandled).not.toHaveBeenCalled();
  });
});
