import { afterEach, describe, expect, it } from "vitest";
import { formatCountdown, loadLastEmail, loadLock, lockUntil, saveLastEmail, saveLock } from "./loginLock";

afterEach(() => localStorage.clear());

describe("login lock (429 countdown)", () => {
  it("locks for 15 minutes", () => {
    expect(lockUntil(1_000)).toBe(1_000 + 15 * 60 * 1000);
  });

  it("formats the remaining time as m:ss, rounding up", () => {
    expect(formatCountdown(15 * 60 * 1000)).toBe("15:00");
    expect(formatCountdown(872_000)).toBe("14:32");
    expect(formatCountdown(500)).toBe("0:01");
    expect(formatCountdown(-5)).toBe("0:00");
  });

  it("remembers an active lock across reloads and forgets an expired one", () => {
    saveLock(10_000);
    expect(loadLock(5_000)).toBe(10_000);
    expect(loadLock(20_000)).toBeNull();
    expect(localStorage.getItem("cadence-login-retry-at")).toBeNull();
  });
});

describe("last email", () => {
  it("stores only the email", () => {
    saveLastEmail("me@example.com");
    expect(loadLastEmail()).toBe("me@example.com");
    expect(Object.keys(localStorage)).toEqual(["cadence-last-email"]);
  });
});
