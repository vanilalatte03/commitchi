import assert from "node:assert/strict";
import { test } from "node:test";
import { renderSVG } from "../src/render";
import type { DexEntry, Species } from "../src/types";
import { makeConfig, makeState } from "./helpers";

const firstSeenAt = "2026-01-15T00:00:00.000Z";
const oneCollectedDex: Record<Species, DexEntry> = {
  yuki: { firstSeenAt, maxStage: "egg" },
};

test("renderSVG shows Korean dex progress when dex is provided", () => {
  const config = makeConfig({ language: "ko" });
  const svg = renderSVG(makeState({}, config), config, oneCollectedDex);

  assert.match(svg, /도감 1\/2/);
  assert.match(svg, />도감 1\/2<\/text>/);
  assert.match(svg, /aria-label="[^"]*, 도감 1\/2"/);
});

test("renderSVG hides visual dex progress during celebrations", () => {
  const config = makeConfig({ language: "ko" });
  const svg = renderSVG(
    makeState(
      {
        celebration: {
          kind: "visitor",
          milestoneId: "visitor:alice:feed",
          title: "냠냠!",
          detail: "Alice가 밥을 줬어요",
        },
      },
      config
    ),
    config,
    oneCollectedDex
  );

  assert.doesNotMatch(svg, />도감 1\/2<\/text>/);
  assert.match(svg, /aria-label="[^"]*, 도감 1\/2"/);
});

test("renderSVG omits dex progress when dex is not provided", () => {
  const config = makeConfig({ language: "ko" });
  const svg = renderSVG(makeState({}, config), config);

  assert.doesNotMatch(svg, /도감|Dex/);
});

test("renderSVG localizes dex progress in English", () => {
  const config = makeConfig({ language: "en" });
  const svg = renderSVG(makeState({}, config), config, oneCollectedDex);

  assert.match(svg, /Dex 1\/2/);
  assert.match(svg, /aria-label="[^"]*, dex 1\/2"/);
});
