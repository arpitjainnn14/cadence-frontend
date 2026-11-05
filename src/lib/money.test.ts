import { describe, expect, it } from "vitest";
import type { Subscription } from "../api/types";
import { dualText, monthlyOf, monthlyTotals } from "./money";

const sub = (currency: "INR" | "USD", yearly_amount: string, status: Subscription["status"] = "active") =>
  ({ currency, yearly_amount, status }) as Subscription;

describe("money (no conversion between ₹ and $)", () => {
  it("gives a subscription's monthly cost in its own currency", () => {
    expect(monthlyOf(sub("USD", "240.00"))).toBe(20);
    expect(monthlyOf(sub("INR", "7788.00"))).toBe(649);
  });

  it("totals ₹ and $ separately and skips inactive subscriptions", () => {
    const t = monthlyTotals([sub("INR", "7788.00"), sub("USD", "240.00"), sub("USD", "120.00"), sub("INR", "1200.00", "paused")]);
    expect(t).toEqual({ inr: 649, usd: 30 });
  });

  it("shows both currencies side by side, or just one", () => {
    expect(dualText({ inr: 2815.25, usd: 30 }, "/mo")).toBe("₹2,815/mo + $30/mo");
    expect(dualText({ inr: 2815, usd: 0 })).toBe("₹2,815");
    expect(dualText({ inr: 0, usd: 2.5 })).toBe("$2.50");
    expect(dualText({ inr: 0, usd: 0 })).toBe("₹0");
  });
});
