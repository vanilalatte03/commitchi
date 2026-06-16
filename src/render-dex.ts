import { DEFAULT_CONFIG } from "./config";
import { listCharacters } from "./characters";
import { getStrings } from "./i18n";
import { paletteFor } from "./render";
import { spriteFor } from "./sprites";
import { CommitchiConfig, DexEntry, Species } from "./types";

const XML_TEXT_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
};

function escapeText(value: string): string {
  return value.replace(/[&<>]/g, (ch) => XML_TEXT_ESCAPES[ch]);
}

function escapeAttr(value: string): string {
  return escapeText(value).replace(/"/g, "&quot;");
}

function hexToUnitRgb(hex: string): [number, number, number] {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) return [0, 0, 0];

  const value = match[1];
  return [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16) / 255) as [
    number,
    number,
    number,
  ];
}

function unit(value: number): string {
  return value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

export function renderDexSVG(
  dex: Record<Species, DexEntry>,
  config: CommitchiConfig = DEFAULT_CONFIG
): string {
  const s = getStrings(config.language);
  const palette = paletteFor(config.theme);
  const characters = listCharacters();
  const collected = Object.keys(dex).length;
  const total = characters.length;
  const columns = 4;
  const width = 480;
  const pad = 16;
  const headerH = 40;
  const cellW = (width - 2 * pad) / columns;
  const cellH = 100;
  const rows = Math.ceil(total / columns);
  const height = pad + headerH + rows * cellH + pad;
  const thumbnail = 60;
  const silhouetteFilterId = "commitchi-dex-silhouette";
  const [r, g, b] = hexToUnitRgb(palette.track);
  const progressText = s.dexProgress(collected, total);
  const ariaLabel = escapeAttr(progressText);

  const cells = characters
    .map((character, index) => {
      const entry = dex[character.id];
      const collectedCharacter = Boolean(entry);
      const repStage = entry?.maxStage ?? "adult";
      const sprite = spriteFor(repStage, character.id, "happy", false);
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = pad + col * cellW;
      const y = pad + headerH + row * cellH;
      const imageX = x + (cellW - thumbnail) / 2;
      const imageY = y + 4;
      const labelX = x + cellW / 2;
      const number = String(character.number).padStart(3, "0");
      const label1 = collectedCharacter
        ? `#${number} ${character.displayName}`
        : `#${number} ???`;
      const label2 = collectedCharacter
        ? `${s.stage[repStage]}${repStage === "adult" ? " ★" : ""}`
        : "—";
      const filter = collectedCharacter ? "" : ` filter="url(#${silhouetteFilterId})"`;

      return `<g>
  <image href="${sprite.href}" x="${imageX}" y="${imageY}" width="${thumbnail}" height="${thumbnail}" preserveAspectRatio="xMidYMid meet"${filter}/>
  <text x="${labelX}" y="${y + 78}" fill="${palette.textMain}" font-family="'Segoe UI',system-ui,sans-serif" font-size="11" font-weight="700" text-anchor="middle">${escapeText(label1)}</text>
  <text x="${labelX}" y="${y + 94}" fill="${palette.textMuted}" font-family="'Segoe UI',system-ui,sans-serif" font-size="10" text-anchor="middle">${escapeText(label2)}</text>
</g>`;
    })
    .join("\n  ");

  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${ariaLabel}">
  <title>${escapeText(progressText)}</title>
  <defs>
    <filter id="${silhouetteFilterId}" color-interpolation-filters="sRGB">
      <feColorMatrix type="matrix" values="0 0 0 0 ${unit(r)}  0 0 0 0 ${unit(g)}  0 0 0 0 ${unit(b)}  0 0 0 1 0"/>
    </filter>
  </defs>
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="16" fill="${palette.card}" stroke="${palette.cardEdge}"/>
  <text x="${pad}" y="${pad + 25}" fill="${palette.textMain}" font-family="'Segoe UI',system-ui,sans-serif" font-size="18" font-weight="700">${escapeText(progressText)}</text>
  ${cells}
</svg>
`;

  return svg.replace(/[ \t]+$/gm, "").replace(/\n{2,}/g, "\n");
}
