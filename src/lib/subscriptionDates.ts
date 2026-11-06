// The two dates on a subscription (API change set 7):
//
// - "Next billing date" (next_billing_date): required, today or later. The
//   backend derives every renewal from it. On edit we send it ONLY if the user
//   changed it: re-sending a clamped month-end date (e.g. the 28th for a sub
//   that bills on the 31st) would move every later renewal.
// - "Started on" (started_on): optional, today or earlier. PUT is a full
//   replace, so we ALWAYS send it (null when empty), otherwise it gets cleared.
import type { SubscriptionIn } from "../api/types";

export function datePayload(f: {
  editing: boolean;
  next: string;
  /** The next billing date the form started with (null for a new subscription). */
  originalNext: string | null;
  startedOn: string;
}): Pick<SubscriptionIn, "next_billing_date" | "started_on"> {
  const started_on = f.startedOn || null;
  if (!f.editing || f.next !== f.originalNext) return { next_billing_date: f.next, started_on };
  return { started_on };
}

/** Inline messages for the two date fields; null means OK. Dates are ISO strings, so text comparison works. */
export function dateErrors(f: { next: string; startedOn: string; today: string }) {
  return {
    next: !f.next ? "Add the next billing date." : f.next < f.today ? "Next billing date can't be in the past." : null,
    startedOn: f.startedOn && f.startedOn > f.today ? "Started on can't be in the future." : null,
  };
}
