import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch, AuthError, ApiError } from "./client";

// Helpers to build fake fetch responses.
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const empty = (status: number) => new Response(null, { status });

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  document.cookie = "csrf_token=abc123; path=/";
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.cookie = "csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
});

const callsTo = (path: string) => fetchMock.mock.calls.filter(([url]) => url === path);

describe("apiFetch", () => {
  it("adds the CSRF header and sends cookies on POST", async () => {
    fetchMock.mockResolvedValueOnce(json(201, { id: "1" }));

    await apiFetch("/api/subscriptions", { method: "POST", json: { merchant_name: "Netflix" } });

    const [, init] = fetchMock.mock.calls[0];
    expect(new Headers(init.headers).get("X-CSRF-Token")).toBe("abc123");
    expect(init.credentials).toBe("include");
  });

  it("does not add the CSRF header on GET", async () => {
    fetchMock.mockResolvedValueOnce(json(200, []));
    await apiFetch("/api/subscriptions");
    const [, init] = fetchMock.mock.calls[0];
    expect(new Headers(init.headers).has("X-CSRF-Token")).toBe(false);
  });

  it("refreshes once on 401, then retries the original request", async () => {
    fetchMock
      .mockResolvedValueOnce(json(401, { detail: "expired" })) // original
      .mockResolvedValueOnce(empty(200)) // refresh
      .mockResolvedValueOnce(json(200, { email: "a@b.c" })); // retry

    const me = await apiFetch<{ email: string }>("/api/auth/me");

    expect(me).toEqual({ email: "a@b.c" });
    expect(callsTo("/api/auth/refresh")).toHaveLength(1);
    expect(callsTo("/api/auth/me")).toHaveLength(2);
  });

  it("shares one refresh between two concurrent 401s", async () => {
    let releaseRefresh!: () => void;
    const refreshGate = new Promise<void>((r) => (releaseRefresh = r));
    const firstTry = new Set<string>();

    fetchMock.mockImplementation(async (url: string) => {
      if (url === "/api/auth/refresh") {
        await refreshGate; // hold the refresh open so both 401s overlap
        return empty(200);
      }
      if (!firstTry.has(url)) {
        firstTry.add(url);
        return json(401, { detail: "expired" });
      }
      return json(200, { url });
    });

    const both = Promise.all([apiFetch("/api/summary"), apiFetch("/api/settings")]);
    await new Promise((r) => setTimeout(r, 0));
    releaseRefresh();

    await expect(both).resolves.toEqual([{ url: "/api/summary" }, { url: "/api/settings" }]);
    expect(callsTo("/api/auth/refresh")).toHaveLength(1);
  });

  it("retries instead of logging out when refresh returns 409 (another tab already refreshed)", async () => {
    fetchMock
      .mockResolvedValueOnce(json(401, { detail: "expired" })) // original
      .mockResolvedValueOnce(json(409, { detail: "Refresh already in progress" })) // refresh lost the race
      .mockResolvedValueOnce(json(200, { monthly: "1.00" })); // retry with the winner's fresh cookies

    await expect(apiFetch("/api/summary")).resolves.toEqual({ monthly: "1.00" });
    expect(callsTo("/api/auth/refresh")).toHaveLength(1);
    expect(callsTo("/api/summary")).toHaveLength(2);
  });

  it("throws AuthError when the refresh fails", async () => {
    fetchMock
      .mockResolvedValueOnce(json(401, { detail: "expired" }))
      .mockResolvedValueOnce(json(401, { detail: "no session" }));

    await expect(apiFetch("/api/summary")).rejects.toBeInstanceOf(AuthError);
  });

  it("does not try to refresh when login itself returns 401", async () => {
    fetchMock.mockResolvedValueOnce(json(401, { detail: "Invalid email or password" }));

    const err = await apiFetch<never>("/api/auth/login", { method: "POST", json: {} }).catch((e: ApiError) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect(err).not.toBeInstanceOf(AuthError);
    expect(err.message).toBe("Invalid email or password");
    expect(callsTo("/api/auth/refresh")).toHaveLength(0);
  });
});
