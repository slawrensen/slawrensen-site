// Every picture on the homepage, drawn by the plugin's own renderers.
//
//   cd <hwinfo-streamdeck checkout at the release tag, after npm ci>
//   npx tsx <this repo>/design/render-faces.mjs <this repo>/public/assets
//
// It imports src/ui/ from that checkout, so the faces are exactly what the
// plugin draws on a key. The readings are fixed example values, one
// consistent machine (CPU 56.3 °C everywhere it appears), not live data.
//
// Output:
//   deck-<theme>-v1.webp   the screens of a Stream Deck + (4 x 2 keys over a
//                          four-dial touch strip) in each of the seven themes,
//                          type accents off so each theme reads as one colour
//   alert-<level>-v1.webp  one reading at normal, warn and critical
//   status-404-v1.webp     a status screen for the 404 page
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const repo = process.cwd();
const outDir = path.resolve(process.argv[2] ?? ".");
const sharp = createRequire(path.join(repo, "package.json"))("sharp");
const load = (p) => import(pathToFileURL(path.join(repo, p)).href);
const { renderReadingKey, renderDualKey, renderTripleKey, renderQuadKey } = await load("src/ui/key-renderer.ts");
const { renderDial, renderDialOverview, renderDialTwoRow } = await load("src/ui/dial-renderer.ts");
const { loadThemes, resolvePalette } = await load("src/ui/themes.ts");

const config = loadThemes();
const THEMES = Object.keys(config.themes);

// Geometry of the deck image, at 2x the size the page shows it.
const K = 288;              // key: the plugin's 144 px face at 2x
const G = 40;               // gap between keys
const M = 44;               // keys to touch strip
const W = 4 * K + 3 * G;    // 1272
const SLOT = W / 4;         // one dial's share of the strip
const S = SLOT / 2;         // dial faces are 2:1
const H = 2 * K + G + M + S;
const KEY_R = Math.round(K * 0.16);
const STRIP_R = 22;

const rounded = (w, h, r) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${r}" ry="${r}"/></svg>`);
const raster = (svg, w, h, density) => sharp(Buffer.from(svg), { density }).resize(w, h, { fit: "fill" }).png().toBuffer();
const clip = async (png, w, h, r) => sharp(png).composite([{ input: rounded(w, h, r), blend: "dest-in" }]).png().toBuffer();

const history = [52, 54, 53, 58, 61, 60, 64, 63, 66, 71, 69, 74, 72, 70, 75, 78, 74, 77, 80, 79, 83, 82, 85, 84, 88, 87, 86, 89, 91, 90, 92, 94, 93, 95, 97, 96];
const flat = [61, 60, 62, 61, 63, 62, 61, 62, 64, 63, 62, 63, 62, 61, 63, 64, 63, 62, 64, 63, 65, 64, 63, 64];
const trend = [52, 54, 53, 57, 60, 58, 62, 65, 63, 66, 70, 68, 71, 69, 72];
const zones = [{ from: 0.8, to: 0.9, color: config.alerts.warn.bg }, { from: 0.9, to: 1, color: config.alerts.crit.bg }];

function keys(p) {
	return [
		renderReadingKey({ label: "CPU (Tctl/Tdie)", valueText: "56.3", unitText: "°C", statBadge: "", history, palette: p }),
		renderReadingKey({ label: "GPU Hot Spot", valueText: "61.8", unitText: "°C", statBadge: "", gauge: { kind: "ring", fraction: 0.62, zones }, palette: p }),
		renderQuadKey({ labels: true, cells: [
			{ label: "CPU", valueText: "56.3", unitText: "°C", color: p.accent },
			{ label: "GPU", valueText: "44.1", unitText: "°C", color: p.accent },
			{ label: "PUMP", valueText: "1762", unitText: "RPM", color: p.accent },
			{ label: "PWR", valueText: "95.4", unitText: "W", color: p.accent },
		], palette: p }),
		renderReadingKey({ label: "CPU Fan", valueText: "1180", unitText: "RPM", statBadge: "", history: flat, palette: p }),
		renderDualKey({ top: { label: "CPU", valueText: "56.3", unitText: "°C", statBadge: "" }, bottom: { label: "GPU", valueText: "44.1", unitText: "°C", statBadge: "" }, palette: p }),
		renderReadingKey({ label: "Total CPU Usage", valueText: "37.4", unitText: "%", statBadge: "", gauge: { kind: "bar", fraction: 0.374, zones }, palette: p }),
		renderTripleKey({ rows: [{ label: "CCD1", valueText: "54.5", unitText: "°C" }, { label: "CCD2", valueText: "47.9", unitText: "°C" }, { label: "Core Max", valueText: "59.4", unitText: "°C" }], palette: p }),
		renderReadingKey({ label: "Package Power", valueText: "142.8", unitText: "W", statBadge: "", history: trend, palette: p }),
	];
}

function dials(p) {
	const rows = [
		{ label: "CPU (Tctl/Tdie)", valueText: "56.3", unitText: "°C", selected: true, valueColor: p.value },
		{ label: "GPU Temperature", valueText: "44.1", unitText: "°C", selected: false, valueColor: p.value },
		{ label: "PUMP SYS1", valueText: "1762", unitText: "RPM", selected: false, valueColor: p.value },
	];
	return [
		renderDial({ title: "CPU (Tctl/Tdie)", valueText: "56.3", unitText: "°C", statsText: "▼ 42.0   ▲ 78.5   session", fraction: 0.62, palette: p, barColor: p.accent }),
		renderDialTwoRow({ rows: [{ ...rows[0], history: trend }, { ...rows[1], history: trend.map((v) => 110 - v) }], footerText: "▼ 42.0  ▲ 78.5  session", palette: p }),
		renderDial({ title: "CPU Package Power", valueText: "142.8", unitText: "W", statsText: "▼ 64.5   ▲ 188   session", fraction: 0.48, palette: p, barColor: p.accent }),
		renderDialOverview({ rows, contextText: "session", statsText: "▼42.0 ▲78.5", palette: p }),
	];
}

for (const theme of THEMES) {
	const p = resolvePalette(config, theme, null, "normal");
	const layers = [];
	const k = keys(p);
	for (let i = 0; i < k.length; i++) {
		const png = await clip(await raster(k[i], K, K, 72 * (K / 144)), K, K, KEY_R);
		layers.push({ input: png, left: (i % 4) * (K + G), top: Math.floor(i / 4) * (K + G) });
	}
	// The touch strip is one screen: four 200 x 100 faces side by side.
	const d = dials(p);
	const strip = await sharp({ create: { width: W, height: S, channels: 4, background: p.bg } })
		.composite(await Promise.all(d.map(async (svg, i) => ({ input: await raster(svg, SLOT, S, 72 * (SLOT / 200)), left: i * SLOT, top: 0 }))))
		.png().toBuffer();
	layers.push({ input: await clip(strip, W, S, STRIP_R), left: 0, top: 2 * K + G + M });
	await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
		.composite(layers).webp({ quality: 90, alphaQuality: 100, effort: 6 })
		.toFile(path.join(outDir, `deck-${theme}-v1.webp`));
	console.log(`deck-${theme}-v1.webp ${W}x${H}`);
}

// One reading, three levels: the alert palette is global, never themed.
const A = 576;
const base = { label: "CPU (Tctl/Tdie)", unitText: "°C", palette: null };
for (const [level, valueText, statBadge] of [["normal", "56.3", ""], ["warn", "87", ""], ["crit", "104", "MAX"]]) {
	const p = resolvePalette(config, "void", "temperature", level);
	const svg = renderReadingKey({ ...base, valueText, statBadge, history: level === "crit" ? undefined : history, palette: p });
	await sharp(await raster(svg, A, A, 72 * (A / 144))).webp({ quality: 92, effort: 6 }).toFile(path.join(outDir, `alert-${level}-v1.webp`));
	console.log(`alert-${level}-v1.webp ${A}x${A}`);
}

// The 404 page's key: the plugin's own "Sensor missing" status screen,
// worded for a missing page.
const { renderStatusKey } = await load("src/ui/key-renderer.ts");
const status = renderStatusKey({ icon: "question", accent: "#f5a623", lines: ["Page missing", "go home"] });
await sharp(await raster(status, 432, 432, 72 * 3)).webp({ quality: 92, effort: 6 }).toFile(path.join(outDir, "status-404-v1.webp"));
console.log("status-404-v1.webp 432x432");
