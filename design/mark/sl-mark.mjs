// Canonical SL mark: one geometry, drawn as strokes on a 64-unit grid.
//
//   node design/mark/sl-mark.mjs            writes design/mark/*.svg
//
// Why strokes on a grid instead of <text>: the previous marks rendered "SL"
// through whatever monospace font the platform had (Consolas, SF Mono,
// Cascadia Code...), so the letters changed shape from machine to machine.
// These paths render identically everywhere and need no font.
//
// Geometry (all values in the 64-unit tile space):
//   tile        64 x 64, corner radius 15 (kept from the original favicon)
//   stroke      W, butt caps, miter joins
//   cap height  CAP, letters vertically centred, then nudged by OPT_Y
//   S           two stacked bowls with corner radius RC on the centreline;
//               short straight verticals keep the counters open and echo
//               the L's right angle (RC = half the bowl height gives a
//               fully round bowl)
//   L           a vertical and a horizontal of equal stroke; its corner is
//               the "bracket" the site reuses for framing and focus
//   spacing     GAP between the S and L outer edges
// Optical centring (OPT_X, OPT_Y) was measured, not guessed: see README.md.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const G = {
  tile: 64, radius: 15,
  W: 6,          // stroke width
  CAP: 30,       // outer cap height
  SW: 19,        // S outer width
  LW: 15.5,      // L outer width
  GAP: 5,        // S to L, outer edge to outer edge
  RC: 4.5,       // S corner radius on the centreline
  OPT_X: 1.125,  // optical shift right (the L's open top-right pulls mass left)
  OPT_Y: -0.5,   // optical shift up (the L's foot pulls mass down)
};

export function letters(g = G) {
  const h = g.W / 2;
  const total = g.SW + g.GAP + g.LW;
  const x0 = (g.tile - total) / 2 + g.OPT_X;          // S outer left
  const yT = (g.tile - g.CAP) / 2 + g.OPT_Y;          // outer top
  const yB = yT + g.CAP;                               // outer bottom
  // S centreline
  const sl = x0 + h, sr = x0 + g.SW - h;
  const t = yT + h, b = yB - h, m = (t + b) / 2;
  const r = Math.min(g.RC, (m - t) / 2);
  const f = (n) => +n.toFixed(3);
  const S = `M${f(sr)} ${f(t)}H${f(sl + r)}A${f(r)} ${f(r)} 0 0 0 ${f(sl)} ${f(t + r)}` +
            `V${f(m - r)}A${f(r)} ${f(r)} 0 0 0 ${f(sl + r)} ${f(m)}` +
            `H${f(sr - r)}A${f(r)} ${f(r)} 0 0 1 ${f(sr)} ${f(m + r)}` +
            `V${f(b - r)}A${f(r)} ${f(r)} 0 0 1 ${f(sr - r)} ${f(b)}H${f(sl)}`;
  // L centreline: butt cap at the top edge, butt cap at the right edge
  const lx = x0 + g.SW + g.GAP + h;
  const L = `M${f(lx)} ${f(yT)}V${f(b)}H${f(x0 + total)}`;
  return { S, L, d: `${S}${L}` };
}

export function svg({ tile = '#5cb8ff', ink = '#07090c', g = G, title = true, square = false } = {}) {
  const { d } = letters(g);
  // square: full-bleed tile for platforms that apply their own mask (iOS).
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">` +
    (title ? `<title>slawrensen</title>` : '') +
    `<rect width="64" height="64" rx="${square ? 0 : g.radius}" fill="${tile}"/>` +
    `<path d="${d}" fill="none" stroke="${ink}" stroke-width="${g.W}" stroke-linejoin="miter" stroke-miterlimit="4"/></svg>\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = path.dirname(fileURLToPath(import.meta.url));
  fs.writeFileSync(path.join(dir, 'sl-mark.svg'), svg());
  fs.writeFileSync(path.join(dir, 'sl-letters.json'), JSON.stringify({ geometry: G, ...letters() }, null, 2) + '\n');
  console.log(svg());
}
