// Turning on renewal notifications (Web Push).
//
// On iPhone, web push only works when Cadence was added to the Home Screen
// (iOS 16.4+) and is running as that installed app. In Safari's normal tab
// `PushManager` simply isn't there, so we detect that and show guidance.
import { api } from "../api/endpoints";

export type PushResult = "enabled" | "denied" | "unsupported" | "not-installed";

export function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
}

export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

/** The VAPID key arrives as base64url text; PushManager wants raw bytes. */
function base64UrlToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export async function getSwRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  return (await navigator.serviceWorker.getRegistration("/")) ?? null;
}

/** Current state, without prompting. */
export async function pushStatus(): Promise<PushResult | "off"> {
  if (isIOS() && !isStandalone()) return "not-installed";
  if (!("PushManager" in window) || !("Notification" in window)) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  const reg = await getSwRegistration();
  const sub = await reg?.pushManager.getSubscription();
  return sub ? "enabled" : "off";
}

/** Must be called from a tap/click handler: browsers only allow the permission prompt then. */
export async function enablePush(): Promise<PushResult> {
  if (isIOS() && !isStandalone()) return "not-installed";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return "unsupported";
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "denied";

  const reg = (await getSwRegistration()) ?? (await navigator.serviceWorker.register("/sw.js"));
  await navigator.serviceWorker.ready;

  const { key } = await api.pushPublicKey();
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlToBytes(key) }));

  await api.pushSubscribe(sub.toJSON());
  return "enabled";
}

export async function disablePush(): Promise<void> {
  const reg = await getSwRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  await api.pushUnsubscribe(sub.endpoint);
  await sub.unsubscribe();
}
