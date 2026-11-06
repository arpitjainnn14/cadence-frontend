// Settings isn't in the mockups, so it reuses the design's building blocks:
// surface cards, pill buttons and the same type scale.
import { useEffect, useState, type ReactNode } from "react";
import { api } from "../api/endpoints";
import { BellIcon, LogoutIcon } from "../components/Icons";
import { ScreenHeader } from "../components/ScreenHeader";
import { useChangePassword, useLogout, useMe, useSettings, useUpdateBudget } from "../data/queries";
import { ApiError } from "../api/client";
import { groupINR, toNum } from "../lib/format";
import { lockUntil, saveLock } from "../lib/loginLock";
import { enablePush, pushStatus, type PushResult } from "../lib/push";
import { Segmented } from "../components/Segmented";
import { setTheme, useTheme, type Theme } from "../ui/theme";
import { useUi } from "../ui/UiContext";
import { APP_NAME } from "../brand";
import { MadeBy } from "../components/MadeBy";

export function Settings() {
  return (
    <div className="flex max-w-[560px] animate-screen-in flex-col gap-5">
      <ScreenHeader eyebrow={APP_NAME} title="Settings" />
      <BudgetSection />
      <AppearanceSection />
      <NotificationsSection />
      <PasswordSection />
      <AccountSection />
      <MadeBy className="pt-4" />
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3.5 rounded-[20px] bg-s1 p-5 shadow-lift">
      <h2 className="m-0 text-base font-semibold tracking-[-0.01em]">{title}</h2>
      {children}
    </section>
  );
}

function AppearanceSection() {
  const { theme } = useTheme();
  return (
    <Section title="Appearance">
      <Segmented<Theme>
        tone="inset"
        height={36}
        value={theme}
        onChange={setTheme}
        options={[
          { value: "dark", label: "Dark" },
          { value: "light", label: "Light" },
        ]}
      />
    </Section>
  );
}

const pill ="h-[34px] rounded-[17px] border-none px-3.5 text-[13px] font-medium disabled:opacity-60";

const PUSH_COPY: Record<PushResult | "off", string> = {
  enabled: "On. You'll get a notification 2 days before each renewal.",
  off: "Get a notification 2 days before each renewal.",
  denied: `Notifications are blocked. Allow them for ${APP_NAME} in your device settings, then try again.`,
  unsupported: "This browser can't receive web notifications.",
  "not-installed": `On iPhone, add ${APP_NAME} to your Home Screen first: tap Share, then “Add to Home Screen”, and open ${APP_NAME} from there.`,
};

function NotificationsSection() {
  const { toast } = useUi();
  const [status, setStatus] = useState<PushResult | "off" | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    pushStatus().then(setStatus).catch(() => setStatus("unsupported"));
  }, []);

  async function turnOn() {
    setBusy(true);
    try {
      setStatus(await enablePush());
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't turn on notifications");
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    try {
      await api.pushTest();
      toast("Test notification sent");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't send");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section title="Renewal reminders">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 flex-none place-items-center rounded-[11px] bg-s2 text-fg2">
          <BellIcon size={18} />
        </div>
        <p className="m-0 flex-1 text-[13.5px] leading-[1.45] text-fg2">{status ? PUSH_COPY[status] : "Checking…"}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {status !== "enabled" && status !== "unsupported" && status !== "not-installed" && (
          <button type="button" onClick={turnOn} disabled={busy || !status} className={`${pill} bg-inv text-invfg`}>
            Turn on notifications
          </button>
        )}
        {status === "enabled" && (
          <button type="button" onClick={test} disabled={busy} className={`${pill} bg-s2 text-fg`}>
            Send a test notification
          </button>
        )}
      </div>
    </Section>
  );
}

function AccountSection() {
  const me = useMe();
  const logout = useLogout();
  return (
    <Section title="Account">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 flex-none place-items-center rounded-full bg-s3 text-[13px] font-semibold text-fg2 uppercase">
          {me.data?.email.slice(0, 2)}
        </div>
        <span className="min-w-0 flex-1 truncate text-[15px]">{me.data?.email}</span>
        <button
          type="button"
          onClick={logout}
          className={`${pill} flex items-center gap-1.5 bg-s2 text-fg`}
        >
          <LogoutIcon size={15} />
          Sign out
        </button>
      </div>
    </Section>
  );
}

/** Monthly budget in ₹ ($ subscriptions aren't counted). Home shows used vs budget. */
function BudgetSection() {
  const settings = useSettings();
  const update = useUpdateBudget();
  const { toast } = useUi();
  const saved = settings.data?.monthly_budget_inr ?? null;
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setValue(saved === null ? "" : String(toNum(saved)));
  }, [saved]);

  const n = toNum(value);
  const changed = value.trim() !== (saved === null ? "" : String(toNum(saved)));

  function save() {
    if (!(n > 0)) return setError("Enter an amount above zero.");
    if (n > 10_000_000) return setError("That's more than ₹1,00,00,000.");
    if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) return setError("Use at most 2 decimal places.");
    update.mutate(value.trim(), {
      onSuccess: () => toast(`Monthly budget set to ₹${groupINR(n)}`),
      onError: (e) => setError(e instanceof ApiError ? e.message : "Couldn't save. Try again."),
    });
  }

  function clear() {
    update.mutate(null, {
      onSuccess: () => toast("Monthly budget removed"),
      onError: (e) => setError(e instanceof ApiError ? e.message : "Couldn't save. Try again."),
    });
  }

  return (
    <Section title="Monthly budget">
      <p className="m-0 text-[13.5px] leading-[1.45] text-fg2">
        Home shows how much of it your ₹ subscriptions use each month. Subscriptions billed in $ aren't counted.
      </p>
      <div className="flex items-center gap-2.5">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-[15px] text-fg3">₹</span>
          <input
            inputMode="decimal"
            aria-label="Monthly budget in rupees"
            placeholder="e.g. 3000"
            value={value}
            onChange={(e) => {
              setValue(e.target.value.replace(/[^0-9.]/g, ""));
              setError("");
            }}
            className="field w-full pl-8! tabular-nums"
            style={error ? { borderColor: "var(--color-warn)" } : undefined}
          />
          <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-[13px] text-fg3">a month</span>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={!changed || !value.trim() || update.isPending}
          className={`${pill} h-[50px]! rounded-xl! bg-inv px-5! text-invfg`}
        >
          Save
        </button>
      </div>
      {error && <span className="text-[13px] text-warn">{error}</span>}
      {saved !== null && (
        <button type="button" onClick={clear} disabled={update.isPending} className="self-start border-none bg-transparent p-0 text-[13px] text-fg2">
          Remove budget
        </button>
      )}
    </Section>
  );
}

/** Current + new + confirm. On success the backend keeps this device signed in and signs out the others. */
function PasswordSection() {
  const change = useChangePassword();
  const me = useMe();
  const { toast } = useUi();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!current) return setError("Enter your current password.");
    if (next.length < 8) return setError("Use at least 8 characters for the new password.");
    if (next.length > 1024) return setError("That's too long (1024 characters at most).");
    if (next !== confirm) return setError("The new passwords don't match.");
    if (next === current) return setError("Choose a password different from the current one.");
    change.mutate(
      { current, next },
      {
        onSuccess: () => {
          setCurrent("");
          setNext("");
          setConfirm("");
          setError("");
          toast("Password changed. Other devices have been signed out.");
        },
        onError: (err) => {
          if (err instanceof ApiError && err.status === 400) return setError("Your current password isn't right.");
          if (err instanceof ApiError && err.status === 422)
            return setError(/different/i.test(err.message) ? "Choose a password different from the current one." : err.message);
          if (err instanceof ApiError && err.status === 429) {
            // The backend locks password changes AND sign-in for 15 minutes.
            // Remember it so the login screen shows the countdown too.
            saveLock(lockUntil());
            return setError("Too many attempts. Password changes and signing in are locked for 15 minutes.");
          }
          setError("Couldn't change the password. Check your connection and try again.");
        },
      },
    );
  }

  const type = show ? "text" : "password";
  return (
    <Section title="Change password">
      <form onSubmit={submit} noValidate className="m-0 flex flex-col gap-2.5">
        {/* A hidden username helps password managers update the right entry. */}
        <input type="email" autoComplete="username" value={me.data?.email ?? ""} readOnly hidden />
        <input
          type={type}
          autoComplete="current-password"
          placeholder="Current password"
          aria-label="Current password"
          value={current}
          onChange={(e) => (setCurrent(e.target.value), setError(""))}
          className="field"
        />
        <input
          type={type}
          autoComplete="new-password"
          placeholder="New password (at least 8 characters)"
          aria-label="New password"
          value={next}
          onChange={(e) => (setNext(e.target.value), setError(""))}
          className="field"
        />
        <input
          type={type}
          autoComplete="new-password"
          placeholder="Confirm new password"
          aria-label="Confirm new password"
          value={confirm}
          onChange={(e) => (setConfirm(e.target.value), setError(""))}
          className="field"
        />
        {error && (
          <span role="alert" className="text-[13px] text-warn">
            {error}
          </span>
        )}
        <div className="flex items-center justify-between gap-3 pt-1">
          <button type="button" onClick={() => setShow(!show)} className="border-none bg-transparent p-0 text-[13px] text-fg2">
            {show ? "Hide passwords" : "Show passwords"}
          </button>
          <button type="submit" disabled={change.isPending} className={`${pill} bg-inv text-invfg`}>
            {change.isPending ? "Changing…" : "Change password"}
          </button>
        </div>
      </form>
    </Section>
  );
}
