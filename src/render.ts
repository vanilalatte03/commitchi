import { DEFAULT_CONFIG } from "./config";
import { CommitchiConfig, PetState, Theme } from "./types";
import { SPECIES_LABEL, STAGE_LABEL, spriteFor } from "./sprites";
import { daysToNextStage } from "./evolution";

const WINTER_PALETTE = {
  card: "#141323",
  cardEdge: "#302D50",
  textMain: "#F4F1FF",
  textMuted: "#AAA4D6",
  track: "#302D50",
  halo: "#2A2453",
  star: "#F6C85F",
  snow: "#9DB7D1",
};

type Palette = typeof WINTER_PALETTE;

const THEME_PALETTES: Record<Theme, Palette> = {
  winter: WINTER_PALETTE,
};

const XML_TEXT_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
};

const MOOD_LABEL = { happy: "기분 좋음", hungry: "배고픔", sick: "아파요" } as const;

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

function barColor(value: number): string {
  if (value >= 60) return "#6FBA65";
  if (value >= 25) return "#E2A33B";
  return "#E46A6A";
}

function escapeText(value: string): string {
  return value.replace(/[&<>]/g, (ch) => XML_TEXT_ESCAPES[ch]);
}

function escapeAttr(value: string): string {
  return escapeText(value).replace(/"/g, "&quot;");
}

function stars(palette: Palette): string {
  const pts = [
    [34, 32, 3.8],
    [58, 154, 4.8],
    [165, 35, 3],
    [448, 42, 3.4],
    [430, 132, 4.2],
  ];
  return pts
    .map(
      ([x, y, dur]) =>
        `<path d="M${x},${y - 5} L${x + 1.5},${y - 1.5} L${x + 5},${y} L${x + 1.5},${y + 1.5} L${x},${y + 5} L${x - 1.5},${y + 1.5} L${x - 5},${y} L${x - 1.5},${y - 1.5} Z" fill="${palette.star}" opacity="0.62"><animate attributeName="opacity" values="0.25;0.82;0.25" dur="${dur}s" repeatCount="indefinite"/></path>`
    )
    .join("");
}

function subtitle(state: PetState): string {
  if (state.stage === "egg") return "Yuki egg · hatching soon";
  if (state.stage === "baby") return "Yuki baby · growing";
  if (state.species === "ghost") return "Yurei · waiting for commits";
  return `${SPECIES_LABEL[state.species]} · ${STAGE_LABEL[state.stage]}`;
}

function progressLine(state: PetState): string {
  if (state.species === "ghost") return "커밋을 하면 다시 깨어나요";
  const left = daysToNextStage(state.ageDays);
  return left === null ? "다 자랐어요" : `다음 진화까지 ${left}일`;
}

export function renderSVG(state: PetState, config: CommitchiConfig = DEFAULT_CONFIG): string {
  const palette = THEME_PALETTES[config.theme];
  const f = Math.round(state.fullness);
  const happiness = Math.round(state.happiness);
  const stamina = Math.round(state.stamina);
  const ghostFloat = state.species === "ghost" && state.stage !== "egg" && state.stage !== "baby";
  const bob = ghostFloat ? "0,-8" : "0,-4";
  const sprite = spriteFor(state.stage, state.species, state.mood);
  const spriteX = Math.round(112 - sprite.displaySize / 2);
  const spriteY = Math.round(166 - sprite.displaySize);
  const titleText = `${escapeText(state.name)} — ${escapeText(subtitle(state))}`;
  const ariaLabel = escapeAttr(
    `${state.name}, a ${state.stage} ${state.species}, ${MOOD_LABEL[state.mood]}, fullness ${f}%, happiness ${happiness}%, stamina ${stamina}%`
  );
  const moodText = escapeText(MOOD_LABEL[state.mood]);
  const progressText = escapeText(progressLine(state));
  const subtitleText = escapeText(subtitle(state));
  const nameText = escapeText(state.name);
  const t = (x: number, y: number, fill: string, size: number, weight = "400", extra = "") =>
    `<text x="${x}" y="${y}" fill="${fill}" font-family="'Segoe UI',system-ui,sans-serif" font-size="${size}"${weight !== "400" ? ` font-weight="${weight}"` : ""}${extra}>`;
  const statRow = (label: string, value: number, y: number) => {
    const safeValue = Math.round(clamp(value, 0, 100));
    const barW = Math.round((148 * safeValue) / 100);
    return `${t(204, y, palette.textMuted, 12)}${label}</text>
  <rect x="276" y="${y - 9}" width="148" height="8" rx="4" fill="${palette.track}"/>
  <rect x="276" y="${y - 9}" width="${barW}" height="8" rx="4" fill="${barColor(safeValue)}"/>
  ${t(448, y, palette.textMain, 11, "600", ' text-anchor="end"')}${safeValue}%</text>`;
  };

  return `<svg width="480" height="200" viewBox="0 0 480 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${ariaLabel}">
  <title>${titleText}</title>
  <rect x="0.5" y="0.5" width="479" height="199" rx="16" fill="${palette.card}" stroke="${palette.cardEdge}"/>
  ${stars(palette)}
  <circle cx="112" cy="104" r="68" fill="${palette.halo}" opacity="0.58"/>
  <path d="M84,52 h56 M74,68 h76 M64,84 h96 M58,100 h108 M64,116 h96 M74,132 h76 M84,148 h56" stroke="${palette.snow}" stroke-width="1" opacity="0.08"/>
  <ellipse cx="112" cy="170" rx="${Math.round(sprite.displaySize * 0.34)}" ry="10" fill="#050611" opacity="0.42"/>
  <g>
    <g>
      <animateTransform attributeName="transform" type="translate" values="0,0; ${bob}; 0,0" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.5;1"/>
      <image href="${sprite.href}" x="${spriteX}" y="${spriteY}" width="${sprite.displaySize}" height="${sprite.displaySize}" preserveAspectRatio="xMidYMid meet"/>
    </g>
  </g>
  ${t(204, 44, palette.textMain, 24, "700")}${nameText}</text>
  ${t(204, 68, palette.textMuted, 13)}${subtitleText}</text>
  ${t(204, 94, palette.textMuted, 12)}기분</text>
  ${t(244, 94, palette.textMain, 14, "700")}${moodText}</text>
  ${statRow("포만감", f, 121)}
  ${statRow("행복도", happiness, 148)}
  ${statRow("체력", stamina, 175)}
  ${t(204, 194, palette.textMuted, 10)}${progressText} · ${state.ageDays}일째</text>
</svg>
`;
}
