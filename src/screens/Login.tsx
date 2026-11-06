// Sign-in screen. Same look as the design, plus a few touches so it feels alive:
// - remembers the last email (never the password)
// - show/hide password, spinner while signing in
// - a gentle shake and inline message on a wrong password (401)
// - a friendly 15-minute countdown when the backend rate-limits (429)
// - a soft entrance; all motion is switched off for "reduce motion" users
//   (see the prefers-reduced-motion rule in index.css)
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ApiError } from "../api/client";
import { APP_NAME, AppTile, TAGLINE } from "../brand";
import { CheckIcon, EyeIcon, EyeOffIcon } from "../components/Icons";
import { justSignedOut } from "../data/signOut";
import { MadeBy } from "../components/MadeBy";
import { useLogin } from "../data/queries";
import { formatCountdown, loadLastEmail, loadLock, lockUntil, saveLastEmail, saveLock } from "../lib/loginLock";

export function Login() {
  const [email, setEmail] = useState(loadLastEmail);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [shakeKey, setShakeKey] = useState(0); // bump to replay the shake
  const [signedOut] = useState(justSignedOut); // confirm a logout that just happened
  const [lockedUntil, setLockedUntil] = useState<number | null>(() => loadLock());
  const [now, setNow] = useState(Date.now());
  const passwordRef = useRef<HTMLInputElement>(null);
  const login = useLogin();

  // Tick once a second while locked out; clear the lock when it runs out.
  useEffect(() => {
    if (!lockedUntil) return;
    const t = setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (n >= lockedUntil) setLockedUntil(null);
    }, 1000);
    return () => clearInterval(t);
  }, [lockedUntil]);

  // If we already know the email, start in the password field.
  useEffect(() => {
    if (email) passwordRef.current?.focus();
  }, []); // once, on first show

  const locked = !!lockedUntil && now < lockedUntil;

  function fail(message: string) {
    setError(message);
    setShakeKey((k) => k + 1);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (locked || login.isPending) return;
    if (!/\S+@\S+\.\S+/.test(email)) return fail("Enter a valid email address.");
    if (!password) return fail("Enter your password.");
    login.mutate(
      { email: email.trim(), password },
      {
        onSuccess: () => {
          saveLastEmail(email.trim());
          setPassword("");
        },
        onError: (err) => {
          if (err instanceof ApiError && err.status === 429) {
            const until = lockUntil();
            saveLock(until);
            setNow(Date.now());
            setLockedUntil(until);
            setError("");
            return;
          }
          if (err instanceof ApiError && err.status === 401) {
            setPassword("");
            passwordRef.current?.focus();
            return fail("That email and password don't match. Try again.");
          }
          fail("Couldn't reach Cadence. Check your connection and try again.");
        },
      },
    );
  }

  return (
    <div
      className="flex h-full flex-col items-center justify-between overflow-y-auto"
      style={{ padding: "calc(env(safe-area-inset-top, 0px) + 24px) 24px calc(env(safe-area-inset-bottom, 0px) + 16px)" }}
    >
      <div />
      <div className="flex w-full max-w-[340px] flex-col gap-9">
        <div className="flex flex-col items-center gap-[18px] text-center">
          <div style={{ animation: "logoIn .7s cubic-bezier(.3,1.4,.4,1) both" }}>
            <AppTile size={60} className="rounded-[13.5px] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6)]" />
          </div>
          <div className="flex flex-col gap-1.5" style={{ animation: "fadeIn .5s ease .12s both" }}>
            <h1 className="m-0 text-[28px] font-bold tracking-[-0.035em]">Sign in to {APP_NAME}</h1>
            <p className="m-0 text-[15px] text-fg2">{TAGLINE}</p>
            {signedOut && (
              <p role="status" className="m-0 mt-2 inline-flex animate-fade-in items-center justify-center gap-1.5 self-center rounded-full bg-s2 px-3 py-1 text-[13px] text-fg2">
                <CheckIcon size={14} /> You're signed out
              </p>
            )}
          </div>
        </div>

        <form
          key={shakeKey}
          onSubmit={submit}
          noValidate
          className="m-0 flex flex-col gap-3.5"
          style={{ animation: shakeKey ? "shake .42s cubic-bezier(.36,.07,.19,.97) both" : "fadeIn .5s ease .22s both" }}
        >
          <label className="flex flex-col gap-[7px]">
            <span className="text-[13px] font-medium text-fg2">Email</span>
            <input
              type="email"
              autoComplete="username"
              inputMode="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="you@example.com"
              className="field bg-s1!"
            />
          </label>
          <label className="flex flex-col gap-[7px]">
            <span className="text-[13px] font-medium text-fg2">Password</span>
            <div className="relative">
              <input
                ref={passwordRef}
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Password"
                className="field w-full bg-s1! pr-12!"
                style={error ? { borderColor: "var(--color-warn)" } : undefined}
                aria-invalid={!!error}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                aria-label={showPw ? "Hide password" : "Show password"}
                aria-pressed={showPw}
                className="absolute top-[7px] right-1.5 grid h-9 w-9 place-items-center rounded-lg border-none bg-transparent text-fg2 hover:text-fg"
              >
                {showPw ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>
          </label>

          {error && (
            <span role="alert" className="animate-fade-in text-[13px] text-warn">
              {error}
            </span>
          )}
          {locked && (
            <div role="status" className="flex animate-fade-in flex-col gap-1 rounded-xl bg-warnbg px-3.5 py-3 text-[13px] text-warn">
              <span className="font-semibold">Too many attempts. Let's take a short break.</span>
              <span>
                You can try again in <span className="font-semibold tabular-nums">{formatCountdown(lockedUntil! - now)}</span>.
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={login.isPending || locked}
            className="mt-2 flex h-[50px] items-center justify-center gap-2.5 rounded-xl border-none bg-inv text-base font-semibold text-invfg transition-[transform,opacity] duration-150 active:scale-[0.98] disabled:opacity-60"
          >
            {login.isPending && <Spinner />}
            {login.isPending ? "Signing in…" : locked ? "Please wait" : "Continue"}
          </button>
        </form>
      </div>
      <MadeBy className="pt-8" />
    </div>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="h-[18px] w-[18px] rounded-full border-2 border-current border-r-transparent"
      style={{ animation: "spin .7s linear infinite" }}
    />
  );
}
