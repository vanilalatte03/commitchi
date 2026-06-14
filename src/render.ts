import { Mood, PetState } from "./types";

const PALETTE = {
  card: "#1b1a2e",
  cardEdge: "#2e2c47",
  textMain: "#ECEAFB",
  textMuted: "#A9A3D6",
  track: "#2e2c47",
  beak: "#EF9F27",
};

interface MoodLook {
  body: string;
  belly: string;
  dark: string;
  label: string;
}

const LOOKS: Record<Mood, MoodLook> = {
  happy: { body: "#7F77DD", belly: "#AFA9EC", dark: "#534AB7", label: "기분 좋음" },
  hungry: { body: "#7F77DD", belly: "#AFA9EC", dark: "#534AB7", label: "배고픔" },
  sick: { body: "#8A9B6B", belly: "#B9C49A", dark: "#5F6E45", label: "아파요" },
};

function barColor(fullness: number): string {
  if (fullness >= 60) return "#639922";
  if (fullness >= 25) return "#BA7517";
  return "#E24B4A";
}

/** Eyes vary by mood: bright open (happy), droopy + sweat (hungry), closed X (sick). */
function eyes(mood: Mood, look: MoodLook): string {
  if (mood === "sick") {
    return `
      <path d="M-23,-13 L-9,1 M-9,-13 L-23,1" stroke="#2C2C2A" stroke-width="3" stroke-linecap="round"/>
      <path d="M9,-13 L23,1 M23,-13 L9,1" stroke="#2C2C2A" stroke-width="3" stroke-linecap="round"/>`;
  }
  const pupilY = mood === "hungry" ? -4 : -7;
  const pr = mood === "hungry" ? 4 : 6;
  const lids =
    mood === "hungry"
      ? `<rect x="-31" y="-23" width="30" height="8" rx="4" fill="${look.dark}"/>
         <rect x="1" y="-23" width="30" height="8" rx="4" fill="${look.dark}"/>`
      : "";
  const blink = `
      <rect x="-31" y="-23" width="30" height="22" rx="11" fill="${look.body}" opacity="0">
        <animate attributeName="opacity" values="0;0;1;0" keyTimes="0;0.93;0.965;1" dur="5s" repeatCount="indefinite"/>
      </rect>
      <rect x="1" y="-23" width="30" height="22" rx="11" fill="${look.body}" opacity="0">
        <animate attributeName="opacity" values="0;0;1;0" keyTimes="0;0.93;0.965;1" dur="5s" repeatCount="indefinite"/>
      </rect>`;
  return `
      <circle cx="-16" cy="-8" r="15" fill="#ffffff"/>
      <circle cx="16" cy="-8" r="15" fill="#ffffff"/>
      <circle cx="-15" cy="${pupilY}" r="${pr}" fill="#26215C"/>
      <circle cx="17" cy="${pupilY}" r="${pr}" fill="#26215C"/>
      <circle cx="-12" cy="${pupilY - 2}" r="2" fill="#ffffff"/>
      <circle cx="20" cy="${pupilY - 2}" r="2" fill="#ffffff"/>
      ${lids}${blink}`;
}

function owl(mood: Mood): string {
  const look = LOOKS[mood];
  const sweat =
    mood === "hungry"
      ? `<path d="M34,-26 q5,9 0,14 q-5,-5 0,-14 Z" fill="#85B7EB" opacity="0.9"/>`
      : "";
  return `
    <g transform="translate(96,104)">
      <animateTransform attributeName="transform" type="translate"
        values="96,104; 96,98; 96,104" dur="3s" repeatCount="indefinite" calcMode="spline"
        keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.5;1"/>
      <ellipse cx="-12" cy="54" rx="8" ry="4" fill="${PALETTE.beak}"/>
      <ellipse cx="12" cy="54" rx="8" ry="4" fill="${PALETTE.beak}"/>
      <path d="M-34,-30 L-22,-52 L-12,-28 Z" fill="${look.dark}"/>
      <path d="M34,-30 L22,-52 L12,-28 Z" fill="${look.dark}"/>
      <ellipse cx="0" cy="8" rx="42" ry="46" fill="${look.body}"/>
      <ellipse cx="-38" cy="10" rx="12" ry="30" fill="${look.dark}"/>
      <ellipse cx="38" cy="10" rx="12" ry="30" fill="${look.dark}"/>
      <ellipse cx="0" cy="18" rx="25" ry="30" fill="${look.belly}"/>
      ${eyes(mood, look)}
      <path d="M0,2 L-7,-5 L7,-5 Z" fill="${PALETTE.beak}"/>
      ${sweat}
    </g>`;
}

function stars(): string {
  const pts = [
    [200, 28],
    [430, 40],
    [360, 24],
    [250, 160],
    [455, 120],
    [185, 95],
  ];
  return pts
    .map(
      ([x, y]) =>
        `<circle cx="${x}" cy="${y}" r="1.6" fill="#4a4570"><animate attributeName="opacity" values="0.3;1;0.3" dur="${
          2 + (x % 3)
        }s" repeatCount="indefinite"/></circle>`
    )
    .join("");
}

export function renderSVG(state: PetState): string {
  const look = LOOKS[state.mood];
  const f = Math.round(state.fullness);
  const barW = Math.round((270 * f) / 100);
  return `<svg width="480" height="200" viewBox="0 0 480 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${state.name}, a ${state.species} that is ${look.label}, fullness ${f}%">
  <title>${state.name} — ${look.label}</title>
  <rect x="0.5" y="0.5" width="479" height="199" rx="16" fill="${PALETTE.card}" stroke="${PALETTE.cardEdge}"/>
  ${stars()}
  ${owl(state.mood)}
  <text x="172" y="46" fill="${PALETTE.textMain}" font-family="'Segoe UI',system-ui,sans-serif" font-size="24" font-weight="600">${state.name}</text>
  <text x="172" y="68" fill="${PALETTE.textMuted}" font-family="'Segoe UI',system-ui,sans-serif" font-size="13">Night Owl · ${state.ageDays}일째</text>
  <text x="172" y="104" fill="${PALETTE.textMuted}" font-family="'Segoe UI',system-ui,sans-serif" font-size="13">기분</text>
  <text x="172" y="126" fill="${PALETTE.textMain}" font-family="'Segoe UI',system-ui,sans-serif" font-size="17" font-weight="600">${look.label}</text>
  <text x="172" y="158" fill="${PALETTE.textMuted}" font-family="'Segoe UI',system-ui,sans-serif" font-size="13">포만감</text>
  <rect x="172" y="168" width="270" height="12" rx="6" fill="${PALETTE.track}"/>
  <rect x="172" y="168" width="${barW}" height="12" rx="6" fill="${barColor(f)}"/>
  <text x="448" y="178" fill="${PALETTE.textMain}" font-family="'Segoe UI',system-ui,sans-serif" font-size="12" text-anchor="end">${f}%</text>
</svg>
`;
}
