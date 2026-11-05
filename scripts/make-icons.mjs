// Generates the PWA icons (the off-white Cadence mark on the app's near-black background)
// without any image library: we rasterise the shape ourselves and write PNGs
// with Node's built-in zlib. Run with `npm run icons`.
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

const BG = [0x0b, 0x0b, 0x0c];
const FG = [0xf5, 0xf5, 0xf4];

// Is point (x, y) in a unit square [-1, 1] inside the Cadence mark?
// The mark: an open ring (a billing cycle) with one dot (the beat) in its gap,
// the same shape as AppMark in src/brand.tsx.
function inMark(x, y) {
  const r = 0.42; // ring radius
  const w = 0.16; // stroke width
  const d = Math.hypot(x, y);
  let a = (Math.atan2(y, x) * 180) / Math.PI; // 0° = right, y points down
  if (a < 0) a += 360;
  const inGap = a < 45 || a > 315; // the opening on the right
  if (!inGap && Math.abs(d - r) <= w / 2) return true;
  // rounded ends of the stroke
  for (const deg of [45, 315]) {
    const ex = r * Math.cos((deg * Math.PI) / 180);
    const ey = r * Math.sin((deg * Math.PI) / 180);
    if (Math.hypot(x - ex, y - ey) <= w / 2) return true;
  }
  // the beat
  return Math.hypot(x - 0.56, y) <= 0.1;
}

function render(size) {
  const ss = 4; // supersampling for smooth edges
  const px = Buffer.alloc(size * size * 3);
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      let hits = 0;
      for (let sj = 0; sj < ss; sj++) {
        for (let si = 0; si < ss; si++) {
          const x = ((i + (si + 0.5) / ss) / size) * 2 - 1;
          const y = ((j + (sj + 0.5) / ss) / size) * 2 - 1;
          if (inMark(x + 0.08, y)) hits++; // +0.08 centres the ring + dot visually
        }
      }
      const t = hits / (ss * ss);
      const o = (j * size + i) * 3;
      for (let c = 0; c < 3; c++) px[o + c] = Math.round(BG[c] + (FG[c] - BG[c]) * t);
    }
  }
  return png(size, px);
}

function png(size, rgb) {
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let j = 0; j < size; j++) rgb.copy(raw, j * (size * 3 + 1) + 1, j * size * 3, (j + 1) * size * 3);
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(td) >>> 0);
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function crc32(buf) {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return ~c;
}

mkdirSync("public/icons", { recursive: true });
writeFileSync("public/icons/icon-192.png", render(192));
writeFileSync("public/icons/icon-512.png", render(512));
writeFileSync("public/icons/apple-touch-icon.png", render(180));
console.log("Wrote public/icons/*.png");
