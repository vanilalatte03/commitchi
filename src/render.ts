import { PetState } from "./types";
import { SPECIES_LABEL, STAGE_LABEL, spriteFor } from "./sprites";
import { daysToNextStage } from "./evolution";

const PALETTE = {
  card: "#141323",
  cardEdge: "#302D50",
  textMain: "#F4F1FF",
  textMuted: "#AAA4D6",
  track: "#302D50",
  halo: "#2A2453",
  star: "#F6C85F",
  snow: "#9DB7D1",
};

const MOOD_LABEL = { happy: "기분 좋음", hungry: "배고픔", sick: "아파요" } as const;

function barColor(f: number): string {
  if (f >= 60) return "#6FBA65";
  if (f >= 25) return "#E2A33B";
  return "#E46A6A";
}

function stars(): string {
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
        `<path d="M${x},${y - 5} L${x + 1.5},${y - 1.5} L${x + 5},${y} L${x + 1.5},${y + 1.5} L${x},${y + 5} L${x - 1.5},${y + 1.5} L${x - 5},${y} L${x - 1.5},${y - 1.5} Z" fill="${PALETTE.star}" opacity="0.62"><animate attributeName="opacity" values="0.25;0.82;0.25" dur="${dur}s" repeatCount="indefinite"/></path>`
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

export function renderSVG(state: PetState): string {
  const f = Math.round(state.fullness);
  const barW = Math.round((220 * f) / 100);
  const ghostFloat = state.species === "ghost" && state.stage !== "egg" && state.stage !== "baby";
  const bob = ghostFloat ? "0,-8" : "0,-4";
  const sprite = spriteFor(state.stage, state.species, state.mood);
  const spriteX = Math.round(112 - sprite.displaySize / 2);
  const spriteY = Math.round(166 - sprite.displaySize);
  const t = (x: number, y: number, fill: string, size: number, weight = "400", extra = "") =>
    `<text x="${x}" y="${y}" fill="${fill}" font-family="'Segoe UI',system-ui,sans-serif" font-size="${size}"${weight !== "400" ? ` font-weight="${weight}"` : ""}${extra}>`;

  return `<svg width="480" height="200" viewBox="0 0 480 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${state.name}, a ${state.stage} ${state.species}, ${MOOD_LABEL[state.mood]}, fullness ${f}%">
  <title>${state.name} — ${subtitle(state)}</title>
  <rect x="0.5" y="0.5" width="479" height="199" rx="16" fill="${PALETTE.card}" stroke="${PALETTE.cardEdge}"/>
  ${stars()}
  <circle cx="112" cy="104" r="68" fill="${PALETTE.halo}" opacity="0.58"/>
  <path d="M84,52 h56 M74,68 h76 M64,84 h96 M58,100 h108 M64,116 h96 M74,132 h76 M84,148 h56" stroke="${PALETTE.snow}" stroke-width="1" opacity="0.08"/>
  <ellipse cx="112" cy="170" rx="${Math.round(sprite.displaySize * 0.34)}" ry="10" fill="#050611" opacity="0.42"/>
  <g>
    <g>
      <animateTransform attributeName="transform" type="translate" values="0,0; ${bob}; 0,0" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.5;1"/>
      <image href="${sprite.href}" x="${spriteX}" y="${spriteY}" width="${sprite.displaySize}" height="${sprite.displaySize}" preserveAspectRatio="xMidYMid meet"/>
    </g>
  </g>
  ${t(204, 44, PALETTE.textMain, 24, "700")}${state.name}</text>
  ${t(204, 68, PALETTE.textMuted, 13)}${subtitle(state)}</text>
  ${t(204, 103, PALETTE.textMuted, 13)}기분</text>
  ${t(204, 127, PALETTE.textMain, 19, "700")}${MOOD_LABEL[state.mood]}</text>
  ${t(204, 153, PALETTE.textMuted, 13)}포만감</text>
  <rect x="204" y="161" width="220" height="12" rx="6" fill="${PALETTE.track}"/>
  <rect x="204" y="161" width="${barW}" height="12" rx="6" fill="${barColor(f)}"/>
  ${t(448, 171, PALETTE.textMain, 12, "600", ' text-anchor="end"')}${f}%</text>
  ${t(204, 190, PALETTE.textMuted, 12)}${progressLine(state)} · ${state.ageDays}일째</text>
</svg>
`;
}
