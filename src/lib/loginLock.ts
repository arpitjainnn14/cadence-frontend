// After too many failed logins the backend answers 429 and blocks further
// attempts for 15 minutes. We remember when the block ends (just a timestamp,
// never a password) so the countdown survives a page reload.
export const LOCK_MS = 15 * 60 * 1000;
const KEY = "cadence-login-retry-at";

export function lockUntil(now: number = Date.now()): number {
  return now + LOCK_MS;
}

/** 872_000 ms -> "14:32" (minutes:seconds, rounded up so it never shows 0:00 early). */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function saveLock(until: number) {
  try {
    localStorage.setItem(KEY, String(until));
  } catch {
    /* private mode: the countdown just won't survive a reload */
  }
}

export function loadLock(now: number = Date.now()): number | null {
  try {
    const v = Number(localStorage.getItem(KEY));
    if (v > now) return v;
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  return null;
}

// The last email used to sign in, so the field is pre-filled next time.
// Only the email: the password is never stored anywhere.
const EMAIL_KEY = "cadence-last-email";

export function loadLastEmail(): string {
  try {
    return localStorage.getItem(EMAIL_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveLastEmail(email: string) {
  try {
    localStorage.setItem(EMAIL_KEY, email);
  } catch {
    /* ignore */
  }
}
