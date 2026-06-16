import assert from "node:assert/strict";
import { test } from "node:test";
import { renderDexSVG } from "../src/render-dex";
import type { DexEntry, Species } from "../src/types";
import { makeConfig } from "./helpers";

const firstSeenAt = "2026-01-15T00:00:00.000Z";

test("renderDexSVG shows collected and silhouette entries in Korean", () => {
  const dex: Record<Species, DexEntry> = {
    yuki: { firstSeenAt, maxStage: "child" },
  };
  const svg = renderDexSVG(dex, makeConfig({ language: "ko" }));

  assert.match(svg, /도감 1\/2/);
  assert.match(svg, /#001 Yuki/);
  assert.match(svg, /어린이/);
  assert.match(svg, /#002 \?\?\?/);
  assert.match(svg, /<image[^>]+filter="url\(#commitchi-dex-silhouette\)"/);
});

test("renderDexSVG localizes progress in English", () => {
  const dex: Record<Species, DexEntry> = {
    yuki: { firstSeenAt, maxStage: "child" },
  };
  const svg = renderDexSVG(dex, makeConfig({ language: "en" }));

  assert.match(svg, /Dex 1\/2/);
});

test("renderDexSVG hides every uncollected character behind question marks", () => {
  const svg = renderDexSVG({}, makeConfig({ language: "ko" }));

  assert.match(svg, /도감 0\/2/);
  assert.equal(svg.match(/\?\?\?/g)?.length, 2);
});

test("renderDexSVG marks adult collected entries with a star", () => {
  const dex: Record<Species, DexEntry> = {
    yuki: { firstSeenAt, maxStage: "adult" },
  };
  const svg = renderDexSVG(dex, makeConfig({ language: "ko" }));

  assert.match(svg, /성체 ★/);
});
