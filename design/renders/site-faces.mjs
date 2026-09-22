// Scratch-only (not part of the product repo): render the website's key and
// dial faces with the plugin's own renderers and exactly the inputs of
// scripts/contact-sheet.mjs at tag v1.6.0, rasterised at 3x density so they
// stay sharp on high-DPI screens. Output: one lossless WebP per face.
// Usage: npx tsx scripts/site-faces.mjs <outDir>
import path from "node:path";
import sharp from "sharp";

import { renderDial, renderDialOverview, renderDialTwoRow } from "../src/ui/dial-renderer";
import { renderDualKey, renderQuadKey, renderReadingKey, renderTripleKey } from "../src/ui/key-renderer";
import { classifyTypeAccent, loadThemes, resolvePalette } from "../src/ui/themes";
import { SensorType } from "../src/hwinfo/types";

const outDir = process.argv[2] ?? ".";
const SCALE = 3;
const config = loadThemes();
const history = [52, 54, 53, 58, 61, 60, 64, 63, 66, 71, 69, 74, 72, 70, 75, 78, 74, 77, 80, 79, 83, 82, 85, 84, 88, 87, 86, 89, 91, 90, 92, 94, 93, 95, 97, 96];
const READINGS = {
	void: { label: "CPU (Tctl/Tdie)", value: "56.3", unit: "°C", type: SensorType.Temperature },
	graphite: { label: "CPU Fan", value: "1180", unit: "RPM", type: SensorType.Fan },
	ultraviolet: { label: "Total CPU Usage", value: "37.4", unit: "%", type: SensorType.Usage },
	midnight: { label: "Current DL rate", value: "390", unit: "Mbps", type: SensorType.Other },
	forest: { label: "Core 0 Clock", value: "5462", unit: "MHz", type: SensorType.Clock },
	ember: { label: "CPU Package Power", value: "142.8", unit: "W", type: SensorType.Power },
	paper: { label: "Vcore", value: "1.288", unit: "V", type: SensorType.Voltage }
};

// Keys: the SVG is 144x144; density 72*SCALE rasterises it at SCALE x.
const key = (svg, name) => sharp(Buffer.from(svg), { density: 72 * SCALE })
	.webp({ lossless: true, effort: 6 }).toFile(path.join(outDir, `${name}.webp`));
// Dials: contact-sheet.mjs draws the 200x100 render into a 233x117 box
// measured off the hardware photo; keep that proportion at SCALE x.
const DIAL_W = Math.round(144 * 470 / 290) * SCALE, DIAL_H = Math.round(DIAL_W / 2);
const dial = (svg, name) => sharp(Buffer.from(svg), { density: 72 * SCALE * 1.2 })
	.resize(DIAL_W, DIAL_H, { fit: "fill" }).webp({ lossless: true, effort: 6 }).toFile(path.join(outDir, `${name}.webp`));

for (const [theme, r] of Object.entries(READINGS)) {
	const accent = classifyTypeAccent(r.type, r.unit, r.label);
	await key(renderReadingKey({ label: r.label, valueText: r.value, unitText: r.unit, statBadge: "", history, palette: resolvePalette(config, theme, accent, "normal") }), `face-${theme}`);
	if (theme === "void") {
		await key(renderReadingKey({ label: r.label, valueText: "87", unitText: r.unit, statBadge: "", history, palette: resolvePalette(config, theme, accent, "warn") }), "face-warn");
		await key(renderReadingKey({ label: r.label, valueText: "104", unitText: r.unit, statBadge: "MAX", palette: resolvePalette(config, theme, accent, "crit") }), "face-crit");
	}
}
const facePalette = (accent) => resolvePalette(config, "void", accent, "normal");
await key(renderDualKey({ top: { label: "CPU", valueText: "56.3", unitText: "°C", statBadge: "" }, bottom: { label: "GPU", valueText: "44.1", unitText: "°C", statBadge: "" }, palette: facePalette("temperature") }), "face-two");
await key(renderTripleKey({ rows: [{ label: "CCD1", valueText: "54.5", unitText: "°C" }, { label: "CCD2", valueText: "47.9", unitText: "°C" }, { label: "Core Max", valueText: "59.4", unitText: "°C" }], palette: facePalette("temperature") }), "face-three");
await key(renderQuadKey({ cells: [
	{ label: "CPU", valueText: "56.3", unitText: "°C", color: config.typeAccents.temperature },
	{ label: "GPU", valueText: "44.1", unitText: "°C", color: config.typeAccents.load },
	{ label: "PUMP", valueText: "1762", unitText: "RPM", color: config.typeAccents.fan },
	{ label: "PWR", valueText: "95.4", unitText: "W", color: config.typeAccents.power }
], palette: facePalette("temperature") }), "face-four");
const zones = [{ from: 0.8, to: 0.9, color: config.alerts.warn.bg }, { from: 0.9, to: 1, color: config.alerts.crit.bg }];
await key(renderReadingKey({ label: "Total CPU Usage", valueText: "37.4", unitText: "%", statBadge: "", gauge: { kind: "bar", fraction: 0.374, zones }, palette: facePalette("load") }), "face-bar");
await key(renderReadingKey({ label: "CPU (Tctl/Tdie)", valueText: "56.3", unitText: "°C", statBadge: "", gauge: { kind: "ring", fraction: 0.62, zones }, palette: facePalette("temperature") }), "face-ring");

const dialPal = resolvePalette(config, "void", "temperature", "normal");
const overviewRows = [
	{ label: "CPU (Tctl/Tdie)", valueText: "56.3", unitText: "°C", selected: true, valueColor: dialPal.value },
	{ label: "GPU Temperature", valueText: "44.1", unitText: "°C", selected: false, valueColor: dialPal.value },
	{ label: "PUMP SYS1", valueText: "1762", unitText: "RPM", selected: false, valueColor: dialPal.value }
];
const trend = [52, 54, 53, 57, 60, 58, 62, 65, 63, 66, 70, 68, 71, 69, 72];
await dial(renderDial({ title: "CPU (Tctl/Tdie)", valueText: "56.3", unitText: "°C", statsText: "▼ 42.0   ▲ 78.5   session", fraction: 0.62, palette: resolvePalette(config, "midnight", "temperature", "normal"), barColor: config.typeAccents.temperature }), "dial-one");
await dial(renderDialOverview({ rows: overviewRows, contextText: "session", statsText: "▼42.0 ▲78.5", palette: dialPal }), "dial-rows3");
await dial(renderDialTwoRow({ rows: [{ ...overviewRows[0], history: trend }, { ...overviewRows[1], history: trend.map((v) => 110 - v) }], footerText: "▼ 42.0  ▲ 78.5  session", palette: dialPal }), "dial-rows2");
await dial(renderDial({ title: "GPU Hot Spot", valueText: "104", unitText: "°C · MAX", statsText: "▼ 61.0   ▲ 104.0   session", fraction: 0.97, palette: resolvePalette(config, "void", "temperature", "normal"), barColor: config.alerts.crit.bg }), "dial-crit");
console.log(`rendered faces at ${SCALE}x into ${outDir}`);
