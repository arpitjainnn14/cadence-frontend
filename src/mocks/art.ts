// Fake card art for the mock API, shaped like the real images: transparent
// background, longest side 800 px, some portrait and some landscape. It lets
// us check in development that the app shows art uncropped in both
// orientations. Drawn at startup with a canvas; dev only.
import { db } from "./db";

type Spec = { display: string; network?: string; portrait: boolean; from: string; to: string };

const SPECS: Spec[] = [
  { display: "HDFC Bank MoneyBack+", portrait: false, from: "#2a5bd0", to: "#0b1f52" },
  { display: "ICICI Coral", portrait: false, from: "#f08a6f", to: "#7a2626" },
  { display: "Axis Scapia", network: "mastercard", portrait: true, from: "#1f7a70", to: "#06211f" },
  { display: "Axis Scapia", network: "rupay", portrait: true, from: "#5b7f45", to: "#141f10" },
];

async function draw(spec: Spec): Promise<Blob> {
  const [w, h] = spec.portrait ? [504, 800] : [800, 504];
  const canvas = new OffscreenCanvas(w, h);
  const g = canvas.getContext("2d")!;
  const r = Math.min(w, h) * 0.07;
  const grad = g.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, spec.from);
  grad.addColorStop(1, spec.to);
  g.fillStyle = grad;
  g.beginPath();
  g.roundRect(0, 0, w, h, r); // outside this rounded rect stays transparent
  g.fill();
  g.fillStyle = "rgba(255,255,255,0.92)";
  g.font = `600 ${Math.round(Math.min(w, h) * 0.075)}px -apple-system, sans-serif`;
  g.fillText(spec.display, Math.min(w, h) * 0.08, Math.min(w, h) * 0.14);
  g.fillStyle = "#d9bf85";
  g.beginPath();
  g.roundRect(Math.min(w, h) * 0.08, h * 0.42, Math.min(w, h) * 0.13, Math.min(w, h) * 0.1, 8);
  g.fill();
  return canvas.convertToBlob({ type: "image/png" });
}

export async function seedMockArt() {
  if (typeof OffscreenCanvas === "undefined") return;
  for (const spec of SPECS) {
    const pm = db.paymentMethods.find((p) => p.display_name === spec.display && (!spec.network || p.network === spec.network));
    if (!pm) continue;
    db.images.set(pm.id, await draw(spec));
    pm.has_image = true;
  }
}
