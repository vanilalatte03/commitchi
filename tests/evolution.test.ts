import assert from "node:assert/strict";
import { test } from "node:test";
import { daysToNextStage, laterStage, resolveEvolution, stageFor } from "../src/evolution";
import { makeActivity } from "./helpers";

test("stageFor maps boundary ages and in-between ages", () => {
  const cases = [
    [0, "egg"],
    [0.99, "egg"],
    [1, "baby"],
    [2, "baby"],
    [3, "child"],
    [6, "child"],
    [7, "teen"],
    [13, "teen"],
    [14, "adult"],
    [30, "adult"],
  ] as const;

  for (const [ageDays, stage] of cases) {
    assert.equal(stageFor(ageDays), stage);
  }
});

test("daysToNextStage reports whole days until the next threshold", () => {
  assert.equal(daysToNextStage(0), 1);
  assert.equal(daysToNextStage(2), 1);
  assert.equal(daysToNextStage(6), 1);
  assert.equal(daysToNextStage(13), 1);
  assert.equal(daysToNextStage(14), null);
});

test("laterStage keeps the later stage in the shared growth order", () => {
  assert.equal(laterStage("egg", "baby"), "baby");
  assert.equal(laterStage("teen", "child"), "teen");
  assert.equal(laterStage("adult", "adult"), "adult");
});

test("resolveEvolution uses active character before adult and locks at adult", () => {
  const activity = makeActivity();

  assert.deepEqual(resolveEvolution(activity, 7, "", 4, "nari"), {
    stage: "teen",
    species: "nari",
    isGhost: false,
    lockedSpecies: "",
  });

  assert.deepEqual(resolveEvolution(activity, 14, "", 4, "nari"), {
    stage: "adult",
    species: "nari",
    isGhost: false,
    lockedSpecies: "nari",
  });
});

test("resolveEvolution keeps a previous adult lock and marks neglected pets as ghosts", () => {
  const neglected = makeActivity({ daysSinceLastContribution: 4 });

  assert.deepEqual(resolveEvolution(neglected, 20, "yuki", 4, "nari"), {
    stage: "adult",
    species: "yuki",
    isGhost: true,
    lockedSpecies: "yuki",
  });
});
