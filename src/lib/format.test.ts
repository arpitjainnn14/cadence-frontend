import { describe, expect, it } from "vitest";
import { groupINR, inr, plural, price, relDays, shortDate, usd } from "./format";
import { nextRenewal } from "./cycles";

describe("money", () => {
  it("uses Indian digit grouping", () => {
    expect(inr(124500)).toBe("₹1,24,500");
    expect(groupINR(5455.25)).toBe("5,455");
  });
  it("formats dollars plainly", () => {
    expect(usd(20)).toBe("$20");
    expect(usd(9.99)).toBe("$9.99");
    expect(price("20.00", "USD")).toBe("$20");
    expect(price("649.00", "INR")).toBe("₹649");
  });
});

describe("dates", () => {
  it("describes relative days", () => {
    expect(relDays(0)).toBe("today");
    expect(relDays(1)).toBe("tomorrow");
    expect(relDays(2)).toBe("in 2 days");
  });
  it("adds the year only when it differs", () => {
    const now = new Date(2026, 10, 5);
    expect(shortDate("2026-11-06", now)).toBe("6 Nov");
    expect(shortDate("2027-03-02", now)).toBe("2 Mar 2027");
  });
});

describe("nextRenewal", () => {
  const now = new Date(2026, 10, 5); // 5 Nov 2026
  it("rolls a past start date forward", () => {
    expect(nextRenewal("2021-03-06", "monthly", now)).toBe("2026-11-06");
    expect(nextRenewal("2019-03-02", "yearly", now)).toBe("2027-03-02");
  });
  it("keeps today as the renewal", () => {
    expect(nextRenewal("2026-10-05", "monthly", now)).toBe("2026-11-05");
  });
  it("brings a far-future date back to the first one on or after today", () => {
    expect(nextRenewal("2027-02-06", "monthly", now)).toBe("2026-11-06");
  });
  it("clamps to the end of short months", () => {
    expect(nextRenewal("2026-01-31", "monthly", new Date(2026, 1, 1))).toBe("2026-02-28");
  });
});

describe("plural", () => {
  it("uses the singular only for exactly one", () => {
    expect(plural(1, "card", "cards")).toBe("1 card");
    expect(plural(0, "card", "cards")).toBe("0 cards");
    expect(plural(11, "card", "cards")).toBe("11 cards");
  });
});
