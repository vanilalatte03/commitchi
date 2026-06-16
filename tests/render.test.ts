import assert from "node:assert/strict";
import { test } from "node:test";
import { renderSVG, resolveDisplayStage } from "../src/render";
import type { DexEntry, Species } from "../src/types";
import { makeConfig, makeState } from "./helpers";

const firstSeenAt = "2026-01-15T00:00:00.000Z";
const oneCollectedDex: Record<Species, DexEntry> = {
  yuki: { firstSeenAt, maxStage: "egg" },
};

test("renderSVG shows Korean dex progress when dex is provided", () => {
  const config = makeConfig({ language: "ko" });
  const svg = renderSVG(makeState({}, config), config, oneCollectedDex);

  assert.match(svg, /도감 1\/3/);
  assert.match(svg, />도감 1\/3<\/text>/);
  assert.match(svg, /aria-label="[^"]*, 도감 1\/3"/);
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

  assert.doesNotMatch(svg, />도감 1\/3<\/text>/);
  assert.match(svg, /aria-label="[^"]*, 도감 1\/3"/);
});

test("renderSVG omits dex progress when dex is not provided", () => {
  const config = makeConfig({ language: "ko" });
  const svg = renderSVG(makeState({}, config), config);

  assert.doesNotMatch(svg, /도감|Dex/);
});

test("renderSVG localizes dex progress in English", () => {
  const config = makeConfig({ language: "en" });
  const svg = renderSVG(makeState({}, config), config, oneCollectedDex);

  assert.match(svg, /Dex 1\/3/);
  assert.match(svg, /aria-label="[^"]*, dex 1\/3"/);
});

test("resolveDisplayStage follows auto, unlocked pins, dex, ghost, and max-stage equality", () => {
  const adultState = makeState({ stage: "adult", species: "yuki" });
  const teenState = makeState({ stage: "teen", species: "yuki" });
  const ghostState = makeState({ stage: "adult", species: "yuki", isGhost: true });
  const dexAdult: Record<Species, DexEntry> = {
    yuki: { firstSeenAt, maxStage: "adult" },
  };
  const dexChild: Record<Species, DexEntry> = {
    yuki: { firstSeenAt, maxStage: "child" },
  };

  assert.equal(resolveDisplayStage(makeConfig({ displayStage: "auto" }), adultState, dexAdult), "adult");
  assert.equal(resolveDisplayStage(makeConfig({ displayStage: "baby" }), adultState, dexAdult), "baby");
  assert.equal(resolveDisplayStage(makeConfig({ displayStage: "teen" }), adultState, dexChild), "adult");
  assert.equal(resolveDisplayStage(makeConfig({ displayStage: "baby" }), adultState, undefined), "adult");
  assert.equal(resolveDisplayStage(makeConfig({ displayStage: "baby" }), ghostState, dexAdult), "adult");
  assert.equal(resolveDisplayStage(makeConfig({ displayStage: "teen" }), teenState, { yuki: { firstSeenAt, maxStage: "teen" } }), "teen");
});

test("renderSVG uses an unlocked displayStage only for visual stage output", () => {
  const config = makeConfig({ displayStage: "baby", language: "en" });
  const dex: Record<Species, DexEntry> = {
    yuki: { firstSeenAt, maxStage: "adult" },
  };
  const svg = renderSVG(makeState({ stage: "adult", ageDays: 30, species: "yuki" }, config), config, dex);

  assert.match(svg, /width="118" height="118"/);
  assert.doesNotMatch(svg, /width="158" height="158"/);
  assert.match(svg, /Yuki baby · growing/);
  assert.match(svg, /aria-label="Mochi, Baby Yuki,/);
  assert.match(svg, /Fully grown · day 30/);
});
