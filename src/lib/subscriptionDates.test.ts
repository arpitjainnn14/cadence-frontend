import { describe, expect, it } from "vitest";
import { dateErrors, datePayload } from "./subscriptionDates";

describe("datePayload (the two date rules of change set 7)", () => {
  it("always sends next_billing_date when creating", () => {
    expect(datePayload({ editing: false, next: "2026-12-01", originalNext: null, startedOn: "" })).toEqual({
      next_billing_date: "2026-12-01",
      started_on: null,
    });
  });

  it("omits next_billing_date on edit when the user didn't change it", () => {
    const body = datePayload({ editing: true, next: "2026-12-01", originalNext: "2026-12-01", startedOn: "2025-01-31" });
    expect(body).toEqual({ started_on: "2025-01-31" });
    expect("next_billing_date" in body).toBe(false);
  });

  it("sends next_billing_date on edit when the user changed it", () => {
    expect(datePayload({ editing: true, next: "2026-12-15", originalNext: "2026-12-01", startedOn: "" })).toEqual({
      next_billing_date: "2026-12-15",
      started_on: null,
    });
  });

  it("always sends started_on, as null when empty (omitting it would clear it anyway)", () => {
    expect(datePayload({ editing: true, next: "x", originalNext: "x", startedOn: "" })).toEqual({ started_on: null });
  });
});

describe("dateErrors", () => {
  const today = "2026-11-06";
  it("requires a next billing date that isn't in the past", () => {
    expect(dateErrors({ next: "", startedOn: "", today }).next).toBe("Add the next billing date.");
    expect(dateErrors({ next: "2026-11-05", startedOn: "", today }).next).toBe("Next billing date can't be in the past.");
    expect(dateErrors({ next: "2026-11-06", startedOn: "", today }).next).toBeNull();
  });
  it("allows no start date, but not one in the future", () => {
    expect(dateErrors({ next: today, startedOn: "", today }).startedOn).toBeNull();
    expect(dateErrors({ next: today, startedOn: "2026-11-07", today }).startedOn).toBe("Started on can't be in the future.");
  });
});
