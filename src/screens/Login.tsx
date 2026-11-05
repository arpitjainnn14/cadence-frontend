import { useState, type FormEvent } from "react";
import { ApiError } from "../api/client";
import { useLogin } from "../data/queries";
import { APP_NAME, AppTile, TAGLINE } from "../brand";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const login = useLogin();

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!/\S+@\S+\.\S+/.test(email)) return setError("Enter a valid email address.");
    if (!password) return setError("Enter your password.");
    login.mutate(
      { email, password },
      {
        onError: (err) =>
          setError(err instanceof ApiError && err.status !== 500 ? err.message : "Something went wrong. Try again."),
        onSuccess: () => setPassword(""),
      },
    );
  }

  return (
    <div
      className="flex h-full flex-col items-center justify-center"
      style={{ padding: "calc(env(safe-area-inset-top, 0px) + 24px) 24px calc(env(safe-area-inset-bottom, 0px) + 24px)" }}
    >
      <div className="flex w-full max-w-[340px] flex-col gap-9">
        <div className="flex flex-col items-center gap-[18px] text-center">
          <AppTile size={60} radius={17} className="shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6)]" />
          <div className="flex flex-col gap-1.5">
            <h1 className="m-0 text-[28px] font-bold tracking-[-0.035em]">Sign in to {APP_NAME}</h1>
            <p className="m-0 text-[15px] text-fg2">{TAGLINE}</p>
          </div>
        </div>

        <form onSubmit={submit} noValidate className="m-0 flex flex-col gap-3.5">
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
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Password"
                className="field w-full bg-s1! pr-16!"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute top-[7px] right-1.5 h-9 rounded-lg border-none bg-transparent px-2.5 text-[13px] font-medium text-fg2"
              >
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
          </label>
          {error && (
            <span role="alert" className="text-[13px] text-warn">
              {error}
            </span>
          )}
          <button
            type="submit"
            disabled={login.isPending}
            className="mt-2 h-[50px] rounded-xl border-none bg-inv text-base font-semibold text-invfg transition-transform duration-150 active:scale-[0.98] disabled:opacity-60"
          >
            {login.isPending ? "Signing in…" : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
