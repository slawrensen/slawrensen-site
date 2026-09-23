// Every picture on the homepage, drawn by the plugin's own renderers.
//
//   cd <hwinfo-streamdeck checkout at the release tag, after npm ci>
//   npx tsx <this repo>/design/render-faces.mjs <this repo>/public/assets
//
// It imports src/ui/ from that checkout, so every key and dial face is
// exactly what the plugin draws. The device around them is the Stream Deck +
// XL from the product photograph (marketing/hwinfo-streamdeckxlplus.png),
// redrawn to the proportions measured off that photograph (see GEOMETRY).
// The faces repeat what the photographed deck was showing: the same
// sensors, values and layouts, re-rendered in one theme at a time. They are
// example values, not live data.
//
// Output:
//   deck-<theme>-v3.webp   the whole Stream Deck + XL in each of the seven
//                          themes, type accents off so each reads as one colour
//   alert-<level>-v1.webp  one reading at normal, warn and critical
//   status-404-v1.webp     a status screen for the 404 page
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const repo = process.cwd();
const outDir = path.resolve(process.argv[2] ?? ".");
const sharp = createRequire(path.join(repo, "package.json"))("sharp");
const load = (p) => import(pathToFileURL(path.join(repo, p)).href);
const { renderReadingKey, renderDualKey, renderTripleKey, renderQuadKey, renderStatusKey } = await load("src/ui/key-renderer.ts");
const { renderDial, renderDialTwoRow } = await load("src/ui/dial-renderer.ts");
const { loadThemes, resolvePalette } = await load("src/ui/themes.ts");

const config = loadThemes();
const THEMES = Object.keys(config.themes);

// GEOMETRY, in pixels of the product photograph after straightening it by
// 1.0 degree (it was shot rotated 1.0 degree counter-clockwise; the touch
// strip's top edge rises 50 px over its 2960 px width). Measured on
// 2026-09-23 from gridded crops:
//   body        x 146..3896, y 175..3533, corner radius ~100
//   keys        centres (595, 590) + (col, row) * 357.4, outer size 294
//               (corner keys measured: (594,585) (3455,595) (595,1662) (3448,1665))
//   strip       x 544..3504, y 2042..2290: 2960 x 248, the 12:1 of the
//               + XL's 1200 x 100 touchscreen; six 2:1 slots
//   glass       the black glass panel the strip sits in: x 400..3642,
//               y 1920..2405, lit along its top and bottom edges
//   bay         the recess the knobs sit in: x 350..3650, y 2630..3260
//   knobs       centres x 2007 + (i - 2.5) * 525 (wider apart than the
//               strip's slots, as on the device). Measured on the average of
//               all six knobs, local-contrast enhanced (the bodies are nearly
//               as dark as the bay, so the edge is the outside of the dark
//               flank band): 215 across, running y 2782..3100 as the camera
//               sees it; the cap's top ellipse is 47 tall per half, so the
//               camera looks down on the knobs at about 27 degrees
const BODY = { x: 146, y: 175, w: 3750, h: 3358, r: 100 };
const KEY = { x: 595, y: 590, pitch: 357.4, size: 294, r: 47 };
const STRIP = { x: 544, y: 2042, w: 2960, h: 248, r: 14 };
const KNOB = { x: 2007, pitch: 525, d: 215, top: 2782, foot: 3100, capRy: 47 };
const BAY = { x: 350, y: 2630, w: 3300, h: 630, r: 90 };
const GLASS = { x: 400, y: 1920, w: 3242, h: 485, r: 18 };

const SCALE = 0.4;                 // 3750 photo px -> 1500 px image
const px = (v) => Math.round(v * SCALE);
const W = px(BODY.w), H = px(BODY.h);
const bx = (x) => px(x - BODY.x), by = (y) => px(y - BODY.y);

const roundedMask = (w, h, r) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${r}" ry="${r}"/></svg>`);
const raster = (svg, w, h, density) => sharp(Buffer.from(svg), { density }).resize(w, h, { fit: "fill" }).png().toBuffer();
const clip = async (png, w, h, r) => sharp(png).composite([{ input: roundedMask(w, h, r), blend: "dest-in" }]).png().toBuffer();

// Deterministic example histories (a gentle wander around a level).
function series(seed, n, level, spread) {
	let s = seed, v = level;
	return Array.from({ length: n }, () => {
		s = (s * 16807) % 2147483647;
		v += ((s / 2147483647) - 0.5) * spread;
		v += (level - v) * 0.2;
		return Math.round(v * 100) / 100;
	});
}
const zones = [{ from: 0.8, to: 0.9, color: config.alerts.warn.bg }, { from: 0.9, to: 1, color: config.alerts.crit.bg }];

// What the photographed deck was showing, row by row.
function keyFaces(theme) {
	const p = resolvePalette(config, theme, null, "normal");
	const one = (label, valueText, unitText, seed, level, extra = {}) =>
		renderReadingKey({ label, valueText, unitText, statBadge: "", history: series(seed, 36, level, level * 0.08), palette: p, ...extra });
	const cores = (name, unit, values, level, seed) => values.map((v, i) => one(name(i), v, unit, seed + i, level));
	return [
		// row 1: temperatures
		one("CPU (Tctl/Tdie)", "59.0", "°C", 11, 59), one("CPU Die (average)", "58.2", "°C", 12, 58), one("CPU CCD1 (Tdie)", "52.5", "°C", 13, 52),
		one("CPU CCD2 (Tdie)", "45.3", "°C", 14, 45), one("Core0 (CCD1)", "44.9", "°C", 15, 45),
		renderTripleKey({ rows: [{ label: "CCD1", valueText: "52.5", unitText: "°C" }, { label: "CCD2", valueText: "45.3", unitText: "°C" }, { label: "Core Max", valueText: "59.0", unitText: "°C" }], palette: p }),
		one("Core2 (CCD1)", "52.3", "°C", 17, 52),
		renderDualKey({ top: { label: "GPU Hot Max", valueText: "55.4", unitText: "°C", statBadge: "" }, bottom: { label: "CPU", valueText: "59.0", unitText: "°C", statBadge: "" }, palette: p }),
		renderReadingKey({ label: "Total CPU Usage", valueText: "10.0", unitText: "%", statBadge: "", gauge: { kind: "ring", fraction: 0.1, zones }, palette: p }),
		// row 2: clocks
		...cores((i) => `Core ${i} Clock (perf #${i + 1})`, "MHz", ["5625", "5625", "5625", "5625", "5625", "5625"], 5600, 21),
		one("Core 6 Clock (perf #7)", "5388", "MHz", 27, 5400, { statBadge: "AVG" }),
		renderQuadKey({ cells: [
			{ label: "CPU", valueText: "59.0", unitText: "°C", color: p.accent },
			{ label: "GPU", valueText: "45.8", unitText: "°C", color: p.accent },
			{ label: "PUMP", valueText: "1796", unitText: "RPM", color: p.accent },
			{ label: "PWR", valueText: "90.8", unitText: "W", color: p.accent },
		], palette: p }),
		renderReadingKey({ label: "Ghost", valueText: "93.1", unitText: "GB", statBadge: "", gauge: { kind: "bar", fraction: 0.73, zones: [] }, palette: p }),
		// row 3: usage
		...cores((i) => `Core ${i >> 1} T${i & 1} Usage`, "%", ["12.5", "0.77", "14.8", "13.3", "11.7", "59.7", "3.13"], 12, 31),
		renderReadingKey({ label: "No spark d0", valueText: "13", unitText: "%", statBadge: "", palette: p }),
		renderReadingKey({ label: "Warn demo", valueText: "59.0", unitText: "°C", statBadge: "", history: series(39, 36, 59, 3), palette: resolvePalette(config, theme, null, "warn") }),
		// row 4: voltages
		...cores((i) => `Core ${i} VID`, "V", ["1.22", "1.25", "1.25", "1.23", "1.23", "1.23", "1.23"], 1.23, 41),
		one("A very long label for a clock", "2685", "MHz", 48, 2700, { statBadge: "MIN" }),
		renderReadingKey({ label: "Crit demo", valueText: "59.0", unitText: "°C", statBadge: "", history: series(49, 36, 59, 3), palette: resolvePalette(config, theme, null, "crit") }),
	];
}

function dialFaces(theme) {
	const p = resolvePalette(config, theme, null, "normal");
	const row = (label, valueText, unitText, selected, seed, level) => ({ label, valueText, unitText, selected, valueColor: p.value, history: series(seed, 15, level, level * 0.15) });
	return [
		renderDial({ title: "Physical Memory Used", valueText: "20.4", unitText: "GB", statsText: "▼ 20.0GB  ▲ 32.4GB  session", fraction: 0.32, palette: p, barColor: p.accent }),
		renderDialTwoRow({ rows: [row("DIMM 1", "0.00", "°C", true, 51, 20), row("DIMM 2", "39.3", "°C", false, 52, 39)], footerText: "▼ 0.00  ▲ 41.3  session", palette: p }),
		renderDialTwoRow({ rows: [row("12VHPWR Power", "41.6", "W", true, 53, 42), row("Temperature", "45.8", "°C", false, 54, 46)], footerText: "▼ 26.8  ▲ 159 · GPU", palette: p }),
		renderDial({ title: "CPU Package Power", valueText: "90.8", unitText: "W", statsText: "▼ 81.7   ▲ 150   session", fraction: 0.45, palette: p, barColor: p.accent }),
		renderDial({ title: "PSU Power In", valueText: "258", unitText: "W", statsText: "▼ 187   ▲ 340   session", fraction: 0.86, palette: p, barColor: p.accent, zones }),
		renderDial({ title: "CPU (Tctl/Tdie)", valueText: "59.0", unitText: "°C", statsText: "▼ 57.5   ▲ 71.1   session", fraction: 0.2, palette: p, barColor: p.accent }),
	];
}

// The body: dark satin plastic with a lit top chamfer, the glass panel the
// touch strip sits in, and the recessed bay the knobs stand in.
function bodySvg() {
	const r = px(BODY.r);
	const gx = bx(GLASS.x), gy = by(GLASS.y), gw = px(GLASS.w), gh = px(GLASS.h), gr = px(GLASS.r);
	const kx = bx(BAY.x), ky = by(BAY.y), kw = px(BAY.w), kh = px(BAY.h), kr = px(BAY.r);
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<defs>
<linearGradient id="face" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#2a2620"/><stop offset=".06" stop-color="#1d1a16"/><stop offset=".7" stop-color="#181612"/><stop offset="1" stop-color="#110f0c"/>
</linearGradient>
<linearGradient id="bay" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#0b0a08"/><stop offset=".3" stop-color="#12100d"/><stop offset="1" stop-color="#16140f"/>
</linearGradient>
<linearGradient id="lip" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a7a60" stop-opacity="0"/><stop offset=".6" stop-color="#8a7a60" stop-opacity=".12"/><stop offset="1" stop-color="#8a7a60" stop-opacity="0"/></linearGradient>
<linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#0d0c0a"/><stop offset="1" stop-color="#090807"/>
</linearGradient>
</defs>
<rect width="${W}" height="${H}" rx="${r}" fill="url(#face)"/>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="${r - 1}" fill="none" stroke="#5a5247" stroke-opacity=".55" stroke-width="2"/>
<rect x="${gx}" y="${gy}" width="${gw}" height="${gh}" rx="${gr}" fill="url(#glass)"/>
<line x1="${gx + gr}" x2="${gx + gw - gr}" y1="${gy + 1}" y2="${gy + 1}" stroke="#6b6357" stroke-opacity=".6" stroke-width="1.5"/>
<line x1="${gx + gr}" x2="${gx + gw - gr}" y1="${gy + gh - 1}" y2="${gy + gh - 1}" stroke="#6b6357" stroke-opacity=".45" stroke-width="1.5"/>
<rect x="${kx}" y="${ky}" width="${kw}" height="${kh}" rx="${kr}" fill="url(#bay)"/>
<rect x="${kx + 1}" y="${ky + 1}" width="${kw - 2}" height="${kh - 2}" rx="${kr - 1}" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="2"/>
<rect x="${kx + kr * 0.5}" y="${ky + kh - px(70)}" width="${kw - kr}" height="${px(55)}" rx="${px(27)}" fill="url(#lip)"/>
<line x1="${kx + kr}" x2="${kx + kw - kr}" y1="${ky + kh - 1.5}" y2="${ky + kh - 1.5}" stroke="#6b6357" stroke-opacity=".35" stroke-width="1.5"/>
</svg>`;
}

// A knob as the photograph shows it, seen from about 27 degrees above: the
// lit rim of its cap on top, a knurled metal barrel whose front catches the
// room's light as an hourglass (wide under the cap, pinched in the middle,
// wide again at the foot), dark flanks, and a contact shadow at its foot.
function knobSvg() {
	const d = px(KNOB.d), r = d / 2, ry = px(KNOB.capRy);
	const pad = 16, w = d + pad * 2;
	const capY = pad + ry, footY = pad + px(KNOB.foot - KNOB.top) - ry, h = footY + ry + pad * 2;
	const L = pad, R = pad + d, C = pad + r, mid = (capY + footY) / 2;
	const barrel = `M${L},${capY} L${L},${footY} A${r},${ry} 0 0 0 ${R},${footY} L${R},${capY} Z`;
	const hw = r * 0.34, pinch = r * 0.07;
	const glass = `M${C - hw},${capY} C${C - hw},${mid - 4} ${C - pinch},${mid - 6} ${C - pinch},${mid} C${C - pinch},${mid + 6} ${C - hw * 1.25},${footY - 6} ${C - hw * 1.25},${footY + ry * 0.85}
L${C + hw * 1.1},${footY + ry * 0.85} C${C + hw * 1.1},${footY - 6} ${C + pinch},${mid + 6} ${C + pinch},${mid} C${C + pinch},${mid - 6} ${C + hw * 0.8},${mid - 4} ${C + hw * 0.8},${capY} Z`;
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
<defs>
<filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
<filter id="blur" x="-50%" y="-20%" width="200%" height="140%"><feGaussianBlur stdDeviation="3.2"/></filter>
<filter id="glint" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="1.3"/></filter>
<linearGradient id="barrel" x1="0" x2="1" y1="0" y2="0">
<stop offset="0" stop-color="#050404"/><stop offset=".14" stop-color="#16130f"/><stop offset=".36" stop-color="#2a2620"/><stop offset=".5" stop-color="#3a342c"/>
<stop offset=".64" stop-color="#2a2620"/><stop offset=".86" stop-color="#14120e"/><stop offset="1" stop-color="#050404"/>
</linearGradient>
<linearGradient id="refl" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#e8dcc6" stop-opacity=".55"/><stop offset=".42" stop-color="#e8dcc6" stop-opacity=".2"/><stop offset=".62" stop-color="#e8dcc6" stop-opacity=".22"/><stop offset="1" stop-color="#e8dcc6" stop-opacity=".62"/></linearGradient>
<radialGradient id="cap" cx=".45" cy=".4" r=".75"><stop offset="0" stop-color="#34302a"/><stop offset=".75" stop-color="#1b1915"/><stop offset="1" stop-color="#0e0d0b"/></radialGradient>
<pattern id="knurl" width="3.2" height="4" patternUnits="userSpaceOnUse"><rect width="1.2" height="4" fill="#000" fill-opacity=".4"/></pattern>
<clipPath id="bclip"><path d="${barrel}"/></clipPath>
</defs>
<ellipse cx="${C + 4}" cy="${footY + ry * 0.55}" rx="${r * 1.28}" ry="${ry * 1.2}" fill="#000" fill-opacity=".75" filter="url(#soft)"/>
<path d="${barrel}" fill="url(#barrel)"/>
<g clip-path="url(#bclip)">
<path d="${glass}" fill="url(#refl)" filter="url(#blur)"/>
<rect x="${L}" y="${capY}" width="${d}" height="${footY - capY + ry}" fill="url(#knurl)"/>
</g>
<path d="M${L + 4},${footY + ry * 0.2} A${r - 4},${ry - 2} 0 0 0 ${R - 4},${footY + ry * 0.2}" fill="none" stroke="#a89c86" stroke-opacity=".28" stroke-width="1.4"/>
<ellipse cx="${C}" cy="${capY}" rx="${r}" ry="${ry}" fill="url(#cap)"/>
<ellipse cx="${C}" cy="${capY}" rx="${r * 0.7}" ry="${ry * 0.7}" fill="none" stroke="#fff" stroke-opacity=".045" stroke-width="1"/>
<ellipse cx="${C}" cy="${capY}" rx="${r * 0.42}" ry="${ry * 0.42}" fill="none" stroke="#fff" stroke-opacity=".045" stroke-width="1"/>
<path d="M${L + 3},${capY + 2} A${r - 3},${ry - 2} 0 0 1 ${R - 3},${capY + 2}" fill="none" stroke="#f0e2c8" stroke-opacity=".6" stroke-width="3.2" filter="url(#glint)"/>
<path d="M${L + r * 0.35},${capY - ry * 0.72} A${r * 0.8},${ry * 0.7} 0 0 1 ${R - r * 0.45},${capY - ry * 0.66}" fill="none" stroke="#fff8ec" stroke-opacity=".85" stroke-width="2.4" stroke-linecap="round" filter="url(#glint)"/>
</svg>`;
}

const alphaScale = (w, h, a) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#000" fill-opacity="${a}"/></svg>`);

for (const theme of THEMES) {
	const p = resolvePalette(config, theme, null, "normal");
	const k = px(KEY.size), kr = px(KEY.r);
	const sw = px(STRIP.w), sh = px(STRIP.h), slot = sw / 6;

	// The lit screens: 36 keys and the touch strip, on their own layer.
	const screens = [];
	const faces = keyFaces(theme);
	for (let i = 0; i < faces.length; i++) {
		const col = i % 9, rowi = Math.floor(i / 9);
		const cx = bx(KEY.x + col * KEY.pitch), cy = by(KEY.y + rowi * KEY.pitch);
		screens.push({ input: await clip(await raster(faces[i], k, k, 72 * (k / 144) * 2), k, k, kr), left: Math.round(cx - k / 2), top: Math.round(cy - k / 2) });
	}
	const dials = dialFaces(theme);
	const strip = await sharp({ create: { width: sw, height: sh, channels: 4, background: p.bg } })
		.composite(await Promise.all(dials.map(async (svg, i) => ({ input: await raster(svg, Math.round(slot), sh, 72 * (slot / 200) * 2), left: Math.round(i * slot), top: 0 }))))
		.png().toBuffer();
	screens.push({ input: await clip(strip, sw, sh, px(STRIP.r)), left: bx(STRIP.x), top: by(STRIP.y) });
	const screenLayer = await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(screens).png().toBuffer();
	// What those screens throw onto the bezel around them in a dark room.
	const glow = await sharp(await sharp(screenLayer).blur(7).png().toBuffer()).composite([{ input: alphaScale(W, H, 0.32), blend: "dest-in" }]).png().toBuffer();

	const layers = [{ input: Buffer.from(bodySvg()), left: 0, top: 0 }, { input: glow, left: 0, top: 0 }];
	// Key caps: a dark well, a rim lit from above, then the screen, then glass.
	const rim = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${k + 8}" height="${k + 8}"><defs><linearGradient id="rim" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#b8ac99" stop-opacity=".62"/><stop offset=".5" stop-color="#6d6456" stop-opacity=".3"/><stop offset="1" stop-color="#8a8070" stop-opacity=".42"/></linearGradient></defs><rect x="2" y="2" width="${k + 4}" height="${k + 4}" rx="${kr + 2}" fill="#050504" stroke="url(#rim)" stroke-width="1.7"/></svg>`);
	for (const s of screens.slice(0, 36)) layers.push({ input: rim, left: s.left - 4, top: s.top - 4 });
	layers.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${sw + 8}" height="${sh + 8}"><rect x="1" y="1" width="${sw + 6}" height="${sh + 6}" rx="${px(STRIP.r) + 3}" fill="#050504" stroke="#8a8174" stroke-opacity=".3" stroke-width="1.5"/></svg>`), left: bx(STRIP.x) - 4, top: by(STRIP.y) - 4 });
	layers.push({ input: screenLayer, left: 0, top: 0 });
	const sheen = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${k}" height="${k}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".085"/><stop offset=".42" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect width="${k}" height="${k}" rx="${kr}" fill="url(#g)"/></svg>`);
	for (const s of screens.slice(0, 36)) layers.push({ input: sheen, left: s.left, top: s.top });
	layers.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${px(GLASS.w)}" height="${px(GLASS.h)}"><defs><linearGradient id="g" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".05"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect width="${px(GLASS.w)}" height="${px(GLASS.h)}" rx="${px(GLASS.r)}" fill="url(#g)"/></svg>`), left: bx(GLASS.x), top: by(GLASS.y) });
	// Knobs.
	const knob = Buffer.from(knobSvg());
	const pad = 16, r = px(KNOB.d) / 2;
	for (let i = 0; i < 6; i++) {
		layers.push({ input: knob, left: Math.round(bx(KNOB.x + (i - 2.5) * KNOB.pitch) - r - pad), top: by(KNOB.top) - pad });
	}
	await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
		.composite(layers.map((l) => ({ ...l, left: Math.round(l.left), top: Math.round(l.top) })))
		.webp({ quality: 88, alphaQuality: 100, effort: 6 })
		.toFile(path.join(outDir, `deck-${theme}-v3.webp`));
	console.log(`deck-${theme}-v3.webp ${W}x${H}`);
}

// One reading, three levels: the alert palette is global, never themed.
const A = 576;
const history = [52, 54, 53, 58, 61, 60, 64, 63, 66, 71, 69, 74, 72, 70, 75, 78, 74, 77, 80, 79, 83, 82, 85, 84, 88, 87, 86, 89, 91, 90, 92, 94, 93, 95, 97, 96];
for (const [level, valueText, statBadge] of [["normal", "56.3", ""], ["warn", "87", ""], ["crit", "104", "MAX"]]) {
	const p = resolvePalette(config, "void", "temperature", level);
	const svg = renderReadingKey({ label: "CPU (Tctl/Tdie)", unitText: "°C", valueText, statBadge, history: level === "crit" ? undefined : history, palette: p });
	await sharp(await raster(svg, A, A, 72 * (A / 144))).webp({ quality: 92, effort: 6 }).toFile(path.join(outDir, `alert-${level}-v1.webp`));
	console.log(`alert-${level}-v1.webp ${A}x${A}`);
}

// The 404 page's key: the plugin's own "Sensor missing" status screen,
// worded for a missing page.
const status = renderStatusKey({ icon: "question", accent: "#f5a623", lines: ["Page missing", "go home"] });
await sharp(await raster(status, 432, 432, 72 * 3)).webp({ quality: 92, effort: 6 }).toFile(path.join(outDir, "status-404-v1.webp"));
console.log("status-404-v1.webp 432x432");
