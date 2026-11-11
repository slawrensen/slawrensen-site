// The page's aura, rendered by the plugin's own background code.
//
//   cd <hwinfo-streamdeck checkout that has src/ui/deck-art.ts (1.8 or later)>
//   npx tsx <this repo>/tools/aura.mts <this repo>/public/assets
//
// Builds the plugin's Nebula scene (artScene in src/ui/deck-art.ts) for the Void theme at page
// size, seed "slawrensen.com", and writes it as two SVG layers: aura-nebula-v1.svg, the clouds on
// black, and aura-stars-v1.svg, the scene's stars on a transparent ground. The scene is the
// plugin's, unchanged. Only the serialisation differs from the plugin's drawPiece(), which cuts a
// scene into key-sized pieces under a 3 KB limit. Change the -vN when the bytes change.
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const art = await import(pathToFileURL(resolve("src/ui/deck-art.ts")).href);
const out = process.argv[2];
const W = 1600, H = 1000;
const VOID = { bg: "#000000", label: "#7A8393", value: "#FFFFFF" };   // themes.json, void
const SEED = "slawrensen.com";

const scene = art.artScene("nebula", { id: "site", w: W, h: H }, SEED, VOID.bg, VOID.label, VOID.value);
const PROFILE_MID = { at: 0.45, of: 0.6 };     // deck-art.ts: full at the centre, 60 % at 45 % of the radius, nothing at the rim
const short = (n: number) => String(Math.round(n * 1000) / 1000).replace(/^0\./, ".");

const blobs = scene.items.filter((i: any) => i.kind === "blob");
const stars = scene.items.filter((i: any) => i.kind === "star");
const used = [...new Set(blobs.map((b: any) => b.profile))].sort() as number[];
const defs = used.map((p) => {
  const pr = scene.profiles[p];
  return `<radialGradient id="n${p}"><stop stop-color="${pr.color}" stop-opacity="${short(pr.alpha)}"/><stop offset="${PROFILE_MID.at}" stop-color="${pr.color}" stop-opacity="${short(pr.alpha * PROFILE_MID.of)}"/><stop offset="1" stop-color="${pr.color}" stop-opacity="0"/></radialGradient>`;
}).join("");
const clouds = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"><rect width="${W}" height="${H}" fill="${scene.bg}"/><defs>${defs}</defs>${blobs.map((b: any) => `<circle cx="${b.cx}" cy="${b.cy}" r="${b.r}" fill="url(#n${b.profile})"/>`).join("")}</svg>\n`;

const fills = new Map<string, string[]>();
const glows: string[] = [];
for (const s of stars as any[]) {
  if (s.glow > 0) { const c = s.size / 2; glows.push(`<circle cx="${s.x + c}" cy="${s.y + c}" r="${s.glow}" fill="url(#g)"/>`); }
  const d = s.round ? `M${s.x} ${s.y + 0.5}l.5-.5h1l.5.5v1l-.5.5h-1l-.5-.5z` : `M${s.x} ${s.y}h1v1h-1z`;
  (fills.get(s.fill) ?? fills.set(s.fill, []).get(s.fill)!).push(d);
}
const GLOW_DEF = '<radialGradient id="g"><stop stop-color="#FFFFFF" stop-opacity=".28"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>';
const starSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">${glows.length ? `<defs>${GLOW_DEF}</defs>${glows.join("")}` : ""}${[...fills].map(([fill, ds]) => `<path fill="${fill}" d="${ds.join("")}"/>`).join("")}</svg>\n`;

writeFileSync(`${out}/aura-nebula-v1.svg`, clouds);
writeFileSync(`${out}/aura-stars-v1.svg`, starSvg);
console.log(JSON.stringify({
  base: scene.bg, clouds: blobs.length, stars: stars.length,
  profiles: scene.profiles, colors: art.artColors(VOID.bg, VOID.label).clouds,
  reach: art.nebulaReach(VOID), ceiling: art.artCeiling("nebula", VOID),
  bytes: { clouds: clouds.length, stars: starSvg.length },
}, null, 1));
