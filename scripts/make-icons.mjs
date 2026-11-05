// Generates the PWA icons from the Cadence logo, direction 1b ("Renewal ring")
// in Logo.dc.html: an almost-closed ring (a billing cycle) on near-black, with an
// amber dot in the gap for the next renewal. No image library: we rasterise the
// shapes ourselves (with 4x4 supersampling) and write PNGs with Node's zlib.
// Run with `npm run icons`.
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

const BG = [0x05, 0x05, 0x05]; // #050505
const RING = [0xf5, 0xf5, 0xf4]; // #F5F5F4
const DOT = [0xf2, 0xa6, 0x5a]; // #F2A65A, the app's "due soon" amber

// Shapes in the design's 120x120 space, copied from the SVGs in Logo.dc.html.
// "regular" is the app icon; "small" is the design's thicker version for tiny
// sizes like the favicon.
//   regular ring: <path d="M60 30 A30 30 0 1 1 33.5 46" stroke-width="11">, dot (44, 33.5) r7
//   small ring:   <path d="M60 28 A32 32 0 1 1 32 44"   stroke-width="15">, dot (44, 31)   r9
const VARIANTS = {
  regular: { r: 30, width: 11, start: { x: 60, y: 30 }, end: { x: 33.5, y: 46 }, dot: { x: 44, y: 33.5, r: 7 } },
  small: { r: 32, width: 15, start: { x: 60, y: 28 }, end: { x: 32, y: 44 }, dot: { x: 44, y: 31, r: 9 } },
};
const C = 60; // ring centre

function painter(v) {
  // The arc runs clockwise (y points down) from the top (270°) round to `end`
  // (about 208°), leaving a gap in the top-left where the dot sits.
  const endDeg = (Math.atan2(v.end.y - C, v.end.x - C) * 180) / Math.PI + 360;
  const half = v.width / 2;
  return (x, y) => {
    if (Math.hypot(x - v.dot.x, y - v.dot.y) <= v.dot.r) return DOT;
    let a = (Math.atan2(y - C, x - C) * 180) / Math.PI;
    if (a < 0) a += 360;
    const onArc = !(a > endDeg && a < 270);
    if (onArc && Math.abs(Math.hypot(x - C, y - C) - v.r) <= half) return RING;
    for (const p of [v.start, v.end]) if (Math.hypot(x - p.x, y - p.y) <= half) return RING; // round caps
    return BG;
  };
}

// Full-bleed square: iOS and Android apply their own rounded mask. The mark
// sits well inside the 80% "safe zone", so the same art works as maskable.
function render(size, variant = "regular") {
  const paint = painter(VARIANTS[variant]);
  const ss = 4;
  const px = Buffer.alloc(size * size * 3);
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const sum = [0, 0, 0];
      for (let sj = 0; sj < ss; sj++) {
        for (let si = 0; si < ss; si++) {
          const col = paint(((i + (si + 0.5) / ss) / size) * 120, ((j + (sj + 0.5) / ss) / size) * 120);
          for (let c = 0; c < 3; c++) sum[c] += col[c];
        }
      }
      const o = (j * size + i) * 3;
      for (let c = 0; c < 3; c++) px[o + c] = Math.round(sum[c] / (ss * ss));
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
writeFileSync("public/icons/favicon-32.png", render(32, "small")); // PNG fallback; public/favicon.svg is the main favicon
console.log("Wrote public/icons/*.png");
