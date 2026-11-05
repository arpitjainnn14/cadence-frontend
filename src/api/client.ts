/**
 * The one place the app talks to the backend.
 *
 * How auth works (the backend sets all of this up, we just play along):
 * - Login tokens live in httpOnly cookies. JavaScript can't read them, which
 *   means an XSS bug can't steal them. We never store tokens ourselves.
 * - `credentials: "include"` makes the browser attach those cookies.
 * - CSRF: cookies are sent automatically, so another site could try to make
 *   your browser POST to us. To prove a request came from *our* page, we copy
 *   the readable `csrf_token` cookie into an `X-CSRF-Token` header. Other
 *   sites can't read our cookies, so they can't forge that header.
 * - The access token lasts 15 minutes. When a request gets a 401 we ask
 *   `/api/auth/refresh` for a new one and retry once.
 * - Refresh is "single-flight": if five requests 401 at the same moment they
 *   all wait on ONE refresh. The backend rotates refresh tokens (each one is
 *   single-use), so two parallel refreshes would look like token theft and
 *   log the user out. Across tabs we can't share a promise, so the backend
 *   answers a near-simultaneous second refresh with 409, and we treat that
 *   as "someone else refreshed; retry".
 */

/** Any non-2xx response. `status` and `detail` come from the backend. */
export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/** The session is gone (refresh failed). The UI should show the login screen. */
export class AuthError extends ApiError {
  constructor(message = "Your session has ended. Please sign in again.") {
    super(401, message);
    this.name = "AuthError";
  }
}

const NO_REFRESH = new Set(["/api/auth/login", "/api/auth/refresh"]);
const UNSAFE = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function readCookie(name: string): string | null {
  const hit = document.cookie.split("; ").find((c) => c.startsWith(name + "="));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : null;
}

let refreshing: Promise<void> | null = null;

/** Single-flight refresh: everyone who calls this while a refresh is running gets the same promise. */
function refreshSession(): Promise<void> {
  if (!refreshing) {
    refreshing = (async () => {
      const res = await send("/api/auth/refresh", { method: "POST" });
      // 409 = another tab (or the installed PWA) rotated the refresh token a
      // moment ago. It already set fresh cookies, so we just retry. Only a
      // 401 from /refresh means the session is really over.
      if (res.status === 409) return;
      if (!res.ok) throw new AuthError();
    })().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

export type ApiOptions = Omit<RequestInit, "body"> & {
  /** A JS value to send as JSON. */
  json?: unknown;
  /** A FormData body (multipart uploads). */
  form?: FormData;
};

function send(path: string, opts: ApiOptions = {}): Promise<Response> {
  const { json, form, headers: extra, ...init } = opts;
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(extra);
  let body: BodyInit | undefined;

  if (json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(json);
  } else if (form) {
    body = form; // the browser sets the multipart boundary itself
  }
  if (UNSAFE.has(method)) {
    const csrf = readCookie("csrf_token");
    if (csrf) headers.set("X-CSRF-Token", csrf);
  }
  return fetch(path, { ...init, method, headers, body, credentials: "include" });
}

async function toError(res: Response): Promise<ApiError> {
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = undefined;
  }
  return new ApiError(res.status, detailMessage(body) ?? `Request failed (${res.status})`, body);
}

/** FastAPI errors are `{detail: "..."}` or, for validation, `{detail: [{msg, loc}]}`. */
function detailMessage(body: unknown): string | null {
  const d = (body as { detail?: unknown } | undefined)?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d) && d.length) {
    const first = d[0] as { msg?: string; loc?: unknown[] };
    const field = Array.isArray(first.loc) ? first.loc[first.loc.length - 1] : null;
    return field ? `${String(field).replace(/_/g, " ")}: ${first.msg}` : (first.msg ?? null);
  }
  return null;
}

/**
 * Call the API. Returns parsed JSON (or `undefined` for 204).
 * Throws `AuthError` if the session can't be refreshed, `ApiError` otherwise.
 */
export async function apiFetch<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  let res = await send(path, opts);

  if (res.status === 401 && !NO_REFRESH.has(path.split("?")[0])) {
    await refreshSession(); // throws AuthError if it fails
    res = await send(path, opts);
    if (res.status === 401) throw new AuthError();
  }

  if (!res.ok) throw await toError(res);
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
