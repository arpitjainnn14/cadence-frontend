import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { keys } from "./queries";
import { signOut } from "./signOut";

describe("signOut (optimistic logout)", () => {
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
