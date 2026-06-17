"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paletteFor = paletteFor;
exports.resolveDisplayStage = resolveDisplayStage;
exports.renderSVG = renderSVG;
const config_1 = require("./config");
const sprites_1 = require("./sprites");
const i18n_1 = require("./i18n");
const evolution_1 = require("./evolution");
const characters_1 = require("./characters");
const DARK_PALETTE = {
    card: "#141323",
    cardEdge: "#302D50",
    textMain: "#F4F1FF",
    textMuted: "#AAA4D6",
    track: "#302D50",
    halo: "#2A2453",
    star: "#F6C85F",
    celebrationBg: "#F6C85F",
    celebrationText: "#141323",
    snow: "#9DB7D1",
};
const THEME_PALETTES = {
    dark: DARK_PALETTE,
};
function paletteFor(theme) {
    return THEME_PALETTES[theme];
}
const XML_TEXT_ESCAPES = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
};
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
function barColor(value) {
    if (value >= 60)
        return "#6FBA65";
    if (value >= 25)
        return "#E2A33B";
    return "#E46A6A";
}
function escapeText(value) {
    return value.replace(/[&<>]/g, (ch) => XML_TEXT_ESCAPES[ch]);
}
function escapeAttr(value) {
    return escapeText(value).replace(/"/g, "&quot;");
}
function activeCharacter(species) {
    const id = species || sprites_1.DEFAULT_SPECIES;
    try {
        return (0, characters_1.getCharacter)(id);
    }
    catch {
        return (0, characters_1.getCharacter)(sprites_1.DEFAULT_SPECIES);
    }
}
function stars(palette) {
    const pts = [
        [34, 32, 3.8],
        [58, 154, 4.8],
        [165, 35, 3],
        [448, 42, 3.4],
        [430, 132, 4.2],
    ];
    return pts
        .map(([x, y, dur]) => `<path d="M${x},${y - 5} L${x + 1.5},${y - 1.5} L${x + 5},${y} L${x + 1.5},${y + 1.5} L${x},${y + 5} L${x - 1.5},${y + 1.5} L${x - 5},${y} L${x - 1.5},${y - 1.5} Z" fill="${palette.star}" opacity="0.62"><animate attributeName="opacity" values="0.25;0.82;0.25" dur="${dur}s" repeatCount="indefinite"/></path>`)
        .join("");
}
function celebrationEffects(palette, active) {
    if (!active)
        return "";
    const sparkles = [
        [50, 72, 0],
        [178, 78, 0.35],
        [66, 140, 0.7],
        [164, 148, 1.05],
    ];
    return `<g aria-hidden="true">
  <circle cx="112" cy="104" r="72" fill="none" stroke="${palette.star}" stroke-width="2" opacity="0.42">
    <animate attributeName="r" values="62;74;62" dur="2.4s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="0.18;0.52;0.18" dur="2.4s" repeatCount="indefinite"/>
  </circle>
  ${sparkles
        .map(([x, y, delay]) => `<path d="M${x},${y - 6} L${x + 1.8},${y - 1.8} L${x + 6},${y} L${x + 1.8},${y + 1.8} L${x},${y + 6} L${x - 1.8},${y + 1.8} L${x - 6},${y} L${x - 1.8},${y - 1.8} Z" fill="${palette.star}" opacity="0.78">
    <animate attributeName="opacity" values="0.15;0.95;0.15" dur="1.8s" begin="${delay}s" repeatCount="indefinite"/>
  </path>`)
        .join("")}
</g>`;
}
function celebrationBadge(state, palette, s) {
    if (!state.celebration)
        return "";
    const label = state.celebration.kind === "visitor"
        ? state.celebration.title
        : s.celebrationBadge(state.celebration.title);
    const text = escapeText(label);
    return `<g aria-hidden="true">
  <rect x="30" y="18" width="164" height="28" rx="8" fill="${palette.celebrationBg}" opacity="0.94"/>
  <text x="112" y="37" fill="${palette.celebrationText}" font-family="'Segoe UI',system-ui,sans-serif" font-size="12" font-weight="700" text-anchor="middle">${text}</text>
</g>`;
}
function subtitle(state, character, s, stage) {
    if (stage === "egg")
        return s.subtitle.egg(character.displayName);
    if (stage === "baby")
        return s.subtitle.baby(character.displayName);
    if (state.isGhost)
        return s.subtitle.ghost(character.ghostName);
    return s.subtitle.default(character.displayName, s.stage[stage]);
}
function progressLine(state, s) {
    if (state.celebration)
        return state.celebration.detail;
    if (state.isGhost)
        return s.progress.ghost;
    const left = (0, evolution_1.daysToNextStage)(state.ageDays);
    return left === null ? s.progress.fullyGrown : s.progress.daysToNext(left);
}
function resolveDisplayStage(config, state, dex) {
    if (config.displayStage === "auto")
        return state.stage;
    if (state.isGhost)
        return state.stage;
    const max = dex?.[state.species]?.maxStage;
    if (!max)
        return state.stage;
    return (0, evolution_1.isStageUnlocked)(config.displayStage, max) ? config.displayStage : state.stage;
}
function renderSVG(state, config = config_1.DEFAULT_CONFIG, dex) {
    const palette = paletteFor(config.theme);
    const s = (0, i18n_1.getStrings)(config.language);
    const character = activeCharacter(state.species);
    const characters = dex ? (0, characters_1.listCharacters)() : [];
    const catalogIds = new Set(characters.map((entry) => entry.id));
    const dexText = dex
        ? s.dexProgress(Object.keys(dex).filter((id) => catalogIds.has(id)).length, characters.length)
        : null;
    const f = Math.round(state.fullness);
    const happiness = Math.round(state.happiness);
    const stamina = Math.round(state.stamina);
    const ghost = state.isGhost;
    const displayStage = resolveDisplayStage(config, state, dex);
    const ghostFloat = ghost && displayStage !== "egg" && displayStage !== "baby";
    const bob = ghostFloat ? "0,-8" : "0,-4";
    const sprite = (0, sprites_1.spriteFor)(displayStage, character.id, state.mood, ghost);
    const spriteX = Math.round(112 - sprite.displaySize / 2);
    const spriteY = Math.round(166 - sprite.displaySize);
    const titleText = `${escapeText(state.name)} — ${escapeText(subtitle(state, character, s, displayStage))}`;
    const reasonText = state.note ? s.reason(state.note) : null;
    const ariaLabel = escapeAttr(s.aria({
        name: state.name,
        stage: s.stage[displayStage],
        species: ghost ? character.ghostName : character.displayName,
        mood: s.mood[state.mood],
        fullness: f,
        happiness,
        stamina,
        celebration: state.celebration ? state.celebration.title : null,
        dex: dexText,
        reason: reasonText,
    }));
    const moodText = escapeText(s.mood[state.mood]);
    // The footer status line carries the reason ("why + how to recover"); during a
    // celebration the celebration detail takes over, and reason falls back to the
    // stage/ghost progress text when a pet has no note yet (legacy state).
    const progressText = escapeText(state.celebration ? progressLine(state, s) : reasonText ?? progressLine(state, s));
    const footerText = state.celebration?.kind === "visitor"
        ? progressText
        : s.footer(progressText, state.ageDays);
    const subtitleText = escapeText(subtitle(state, character, s, displayStage));
    const nameText = escapeText(state.name);
    const t = (x, y, fill, size, weight = "400", extra = "") => `<text x="${x}" y="${y}" fill="${fill}" font-family="'Segoe UI',system-ui,sans-serif" font-size="${size}"${weight !== "400" ? ` font-weight="${weight}"` : ""}${extra}>`;
    const statRow = (label, value, y) => {
        const safeValue = Math.round(clamp(value, 0, 100));
        const barW = Math.round((148 * safeValue) / 100);
        return `${t(204, y, palette.textMuted, 12)}${label}</text>
  <rect x="276" y="${y - 9}" width="148" height="8" rx="4" fill="${palette.track}"/>
  <rect x="276" y="${y - 9}" width="${barW}" height="8" rx="4" fill="${barColor(safeValue)}"/>
  ${t(448, y, palette.textMain, 11, "600", ' text-anchor="end"')}${safeValue}%</text>`;
    };
    const svg = `<svg width="480" height="200" viewBox="0 0 480 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${ariaLabel}">
  <title>${titleText}</title>
  <rect x="0.5" y="0.5" width="479" height="199" rx="16" fill="${palette.card}" stroke="${palette.cardEdge}"/>
  ${stars(palette)}
  <circle cx="112" cy="104" r="68" fill="${palette.halo}" opacity="0.58"/>
  <path d="M84,52 h56 M74,68 h76 M64,84 h96 M58,100 h108 M64,116 h96 M74,132 h76 M84,148 h56" stroke="${palette.snow}" stroke-width="1" opacity="0.08"/>
  ${celebrationEffects(palette, Boolean(state.celebration))}
  ${celebrationBadge(state, palette, s)}
  <ellipse cx="112" cy="170" rx="${Math.round(sprite.displaySize * 0.34)}" ry="10" fill="#050611" opacity="0.42"/>
  <g>
    <g>
      <animateTransform attributeName="transform" type="translate" values="0,0; ${bob}; 0,0" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.5;1"/>
      <image href="${sprite.href}" x="${spriteX}" y="${spriteY}" width="${sprite.displaySize}" height="${sprite.displaySize}" preserveAspectRatio="xMidYMid meet"/>
    </g>
  </g>
  <g transform="translate(0,-8)">
  ${t(204, 44, palette.textMain, 24, "700")}${nameText}</text>
  ${t(204, 68, palette.textMuted, 13)}${subtitleText}</text>
  ${t(204, 94, palette.textMuted, 12)}${escapeText(s.moodHeading)}</text>
  ${t(244, 94, palette.textMain, 14, "700")}${moodText}</text>
  ${statRow(s.stat.fullness, f, 121)}
  ${statRow(s.stat.happiness, happiness, 148)}
  ${statRow(s.stat.stamina, stamina, 175)}
  ${t(204, 194, palette.textMuted, 10)}${footerText}</text>
  ${dexText && !state.celebration ? `${t(448, 194, palette.textMuted, 10, "400", ' text-anchor="end"')}${escapeText(dexText)}</text>` : ""}
  </g>
</svg>
`;
    // Inactive celebration blocks interpolate to "", leaving whitespace-only lines.
    // Strip trailing whitespace and collapse the resulting blank lines so the
    // committed pet.svg stays clean (git diff --check) and tidy.
    return svg.replace(/[ \t]+$/gm, "").replace(/\n{2,}/g, "\n");
}
