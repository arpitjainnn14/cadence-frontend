// Settings isn't in the mockups, so it reuses the design's building blocks:
// surface cards, pill buttons and the same type scale.
import { useEffect, useState, type ReactNode } from "react";
import { api } from "../api/endpoints";
import { BellIcon, LogoutIcon } from "../components/Icons";
import { ScreenHeader } from "../components/ScreenHeader";
import { useLogout, useMe } from "../data/queries";
import { enablePush, pushStatus, type PushResult } from "../lib/push";
import { Segmented } from "../components/Segmented";
import { setTheme, useTheme, type Theme } from "../ui/theme";
import { useUi } from "../ui/UiContext";
import { APP_NAME } from "../brand";

export function Settings() {
  return (
    <div className="flex max-w-[560px] animate-screen-in flex-col gap-5">
      <ScreenHeader eyebrow={APP_NAME} title="Settings" />
      <AppearanceSection />
      <NotificationsSection />
      <AccountSection />
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
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className={`${pill} flex items-center gap-1.5 bg-s2 text-fg`}
        >
          <LogoutIcon size={15} />
          Sign out
        </button>
      </div>
    </Section>
  );
}
