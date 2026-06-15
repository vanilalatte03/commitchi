import assert from "node:assert/strict";
import { join } from "node:path";
import { test } from "node:test";
import {
  applyTick,
  applyVisitorInteraction,
  loadState,
  VISITOR_ACTION_BONUS,
} from "../src/state";
import { makeActivity, makeConfig, makeState, withTempDir, writeJson, writeText } from "./helpers";

const DAY_MS = 86_400_000;
const NOW = new Date("2026-01-15T00:00:00.000Z");

function daysBefore(days: number): string {
  return new Date(NOW.getTime() - days * DAY_MS).toISOString();
}

test("applyTick feeds only newly counted contributions for the same UTC day", () => {
  const config = makeConfig({
    economy: {
      feedPerContrib: 10,
      decayPerDay: 0,
      happinessDecayPerDay: 0,
      staminaDecayPerDay: 0,
    },
  });
  const state = makeState(
    {
      fullness: 50,
      happiness: 50,
      stamina: 50,
      lastTickAt: NOW.toISOString(),
      lastDayDate: "2026-01-14",
      lastDayCounted: 0,
    },
    config
  );
  const activity = makeActivity({
    todayDate: "2026-01-15",
    todayCount: 2,
    streak: 1,
    collabRatio: 0.5,
  });

  const first = applyTick(state, activity, NOW, config);
  assert.equal(first.fullness, 70);
  assert.equal(first.happiness, 60);
  assert.equal(first.stamina, 60);
  assert.equal(first.lastDayCounted, 2);

  const second = applyTick(first, activity, NOW, config);
  assert.equal(second.fullness, first.fullness);
  assert.equal(second.happiness, first.happiness);
  assert.equal(second.stamina, first.stamina);
  assert.equal(second.lastDayCounted, 2);
});

test("applyTick applies elapsed-day decay before gains", () => {
  const config = makeConfig({
    economy: {
      feedPerContrib: 0,
      decayPerDay: 10,
      happinessDecayPerDay: 3,
      staminaDecayPerDay: 2,
    },
  });
  const state = makeState(
    {
      fullness: 80,
      happiness: 80,
      stamina: 80,
      lastTickAt: daysBefore(2),
    },
    config
  );

  const next = applyTick(state, makeActivity(), NOW, config);
  assert.equal(next.fullness, 60);
  assert.equal(next.happiness, 74);
  assert.equal(next.stamina, 76);
});

test("applyTick derives happy, hungry, and sick moods from thresholds and neglect", () => {
  const config = makeConfig({
    economy: {
      feedPerContrib: 0,
      decayPerDay: 0,
      happinessDecayPerDay: 0,
      staminaDecayPerDay: 0,
    },
    thresholds: {
      hungryFullness: 45,
      sickFullness: 15,
      neglectDays: 4,
    },
  });

  const happy = applyTick(
    makeState({ fullness: 46, happiness: 80, stamina: 80 }, config),
    makeActivity(),
    NOW,
    config
  );
  assert.equal(happy.mood, "happy");

  const hungry = applyTick(
    makeState({ fullness: 45, happiness: 80, stamina: 80 }, config),
    makeActivity(),
    NOW,
    config
  );
  assert.equal(hungry.mood, "hungry");

  const sickByStat = applyTick(
    makeState({ fullness: 15, happiness: 80, stamina: 80 }, config),
    makeActivity(),
    NOW,
    config
  );
  assert.equal(sickByStat.mood, "sick");

  const sickByNeglect = applyTick(
    makeState({ fullness: 90, happiness: 90, stamina: 90 }, config),
    makeActivity({ daysSinceLastContribution: 4 }),
    NOW,
    config
  );
  assert.equal(sickByNeglect.mood, "sick");
});

test("applyTick advances stage, follows configured species, and locks species at adult", () => {
  const config = makeConfig({
    character: "nari",
    economy: {
      feedPerContrib: 0,
      decayPerDay: 0,
      happinessDecayPerDay: 0,
      staminaDecayPerDay: 0,
    },
  });

  const teen = applyTick(
    makeState({ bornAt: daysBefore(7), stage: "child", species: "yuki" }, config),
    makeActivity(),
    NOW,
    config
  );
  assert.equal(teen.stage, "teen");
  assert.equal(teen.species, "nari");
  assert.equal(teen.lockedSpecies, "");

  const adult = applyTick(
    makeState({ bornAt: daysBefore(14), stage: "teen", species: "yuki" }, config),
    makeActivity(),
    NOW,
    config
  );
  assert.equal(adult.stage, "adult");
  assert.equal(adult.species, "nari");
  assert.equal(adult.lockedSpecies, "nari");

  const locked = applyTick(
    makeState({ bornAt: daysBefore(20), stage: "adult", species: "yuki", lockedSpecies: "yuki" }, config),
    makeActivity(),
    NOW,
    config
  );
  assert.equal(locked.species, "yuki");
  assert.equal(locked.lockedSpecies, "yuki");
});

test("applyTick emits streak milestones once and records milestone ids", () => {
  const config = makeConfig({
    language: "en",
    economy: {
      feedPerContrib: 0,
      decayPerDay: 0,
      happinessDecayPerDay: 0,
      staminaDecayPerDay: 0,
    },
  });
  const state = makeState(
    {
      bornAt: daysBefore(20),
      stage: "adult",
      celebratedMilestones: [],
    },
    config
  );
  const activity = makeActivity({ streak: 7 });

  const first = applyTick(state, activity, NOW, config);
  assert.equal(first.celebration?.kind, "streak");
  assert.equal(first.celebration?.milestoneId, "streak:7");
  assert.deepEqual(first.celebratedMilestones, ["streak:7"]);

  const second = applyTick(first, activity, NOW, config);
  assert.equal(second.celebration, null);
  assert.deepEqual(second.celebratedMilestones, ["streak:7"]);
});

test("applyTick emits an evolution celebration on stage changes", () => {
  const config = makeConfig({
    language: "en",
    economy: {
      feedPerContrib: 0,
      decayPerDay: 0,
      happinessDecayPerDay: 0,
      staminaDecayPerDay: 0,
    },
  });
  const state = makeState(
    {
      bornAt: daysBefore(3),
      stage: "baby",
      celebratedMilestones: [],
    },
    config
  );

  const next = applyTick(state, makeActivity(), NOW, config);
  assert.equal(next.stage, "child");
  assert.equal(next.celebration?.kind, "evolution");
  assert.equal(next.celebration?.milestoneId, "evolution:child");
  assert.ok(next.celebratedMilestones.includes("evolution:child"));
});

test("applyVisitorInteraction applies feed and play bonuses", () => {
  const config = makeConfig({
    economy: {
      decayPerDay: 0,
      happinessDecayPerDay: 0,
      staminaDecayPerDay: 0,
    },
  });
  const base = makeState({ fullness: 50, happiness: 50, stamina: 50 }, config);

  const feed = applyVisitorInteraction(base, "feed", "Alice", NOW, config);
  assert.equal(feed.applied, true);
  assert.equal(feed.reason, "applied");
  assert.equal(feed.actor, "alice");
  assert.equal(feed.state.fullness, 50 + VISITOR_ACTION_BONUS.feed.fullness);
  assert.equal(feed.state.happiness, 50 + VISITOR_ACTION_BONUS.feed.happiness);
  assert.equal(feed.state.stamina, 50 + VISITOR_ACTION_BONUS.feed.stamina);
  assert.equal(feed.state.celebration?.kind, "visitor");
  assert.deepEqual(feed.state.visitorInteractions.alice, {
    lastInteractionDate: "2026-01-15",
    totalInteractions: 1,
    feedCount: 1,
    playCount: 0,
  });

  const play = applyVisitorInteraction(base, "play", "Bob", NOW, config);
  assert.equal(play.state.fullness, 50 + VISITOR_ACTION_BONUS.play.fullness);
  assert.equal(play.state.happiness, 50 + VISITOR_ACTION_BONUS.play.happiness);
  assert.equal(play.state.stamina, 50 + VISITOR_ACTION_BONUS.play.stamina);
  assert.deepEqual(play.state.visitorInteractions.bob, {
    lastInteractionDate: "2026-01-15",
    totalInteractions: 1,
    feedCount: 0,
    playCount: 1,
  });
});

test("applyVisitorInteraction rate limits the same actor on the same UTC date", () => {
  const config = makeConfig();
  const state = makeState({
    visitorInteractions: {
      alice: {
        lastInteractionDate: "2026-01-15",
        totalInteractions: 1,
        feedCount: 1,
        playCount: 0,
      },
    },
  });

  const update = applyVisitorInteraction(state, "play", "Alice", NOW, config);
  assert.equal(update.applied, false);
  assert.equal(update.reason, "rate_limited");
  assert.strictEqual(update.state, state);
});

test("applyVisitorInteraction decays elapsed stats before applying a bonus", () => {
  const config = makeConfig({
    economy: {
      decayPerDay: 10,
      happinessDecayPerDay: 5,
      staminaDecayPerDay: 4,
    },
  });
  const state = makeState(
    {
      fullness: 50,
      happiness: 50,
      stamina: 50,
      lastTickAt: daysBefore(1),
    },
    config
  );

  const update = applyVisitorInteraction(state, "feed", "Alice", NOW, config);
  assert.equal(update.state.fullness, 58);
  assert.equal(update.state.happiness, 49);
  assert.equal(update.state.stamina, 46);
});

test("loadState returns a fresh egg when the state file is missing", () => {
  withTempDir((dir) => {
    const path = join(dir, "missing-state.json");
    const config = makeConfig({ petName: "Nova", character: "nari" });

    const state = loadState(NOW, config, path);
    assert.equal(state.name, "Nova");
    assert.equal(state.species, "nari");
    assert.equal(state.stage, "egg");
    assert.equal(state.isGhost, false);
    assert.equal(state.bornAt, NOW.toISOString());
    assert.equal(state.lastTickAt, NOW.toISOString());
  });
});

test("loadState normalizes legacy ghost species to ghost variant on the configured species", () => {
  withTempDir((dir) => {
    const path = join(dir, "state.json");
    const config = makeConfig({ character: "nari" });
    const legacy: Record<string, unknown> = {
      ...makeState({ species: "ghost" }, config),
      species: "ghost",
    };
    delete legacy.isGhost;
    writeJson(path, legacy);

    const state = loadState(NOW, config, path);
    assert.equal(state.species, "nari");
    assert.equal(state.isGhost, true);
  });
});

test("loadState gives lockedSpecies priority over the configured character", () => {
  withTempDir((dir) => {
    const config = makeConfig({ character: "nari" });
    const lockedPath = join(dir, "locked.json");
    writeJson(lockedPath, makeState({ species: "nari", lockedSpecies: "yuki" }, config));

    const locked = loadState(NOW, config, lockedPath);
    assert.equal(locked.species, "yuki");
    assert.equal(locked.lockedSpecies, "yuki");

    const unlockedPath = join(dir, "unlocked.json");
    writeJson(unlockedPath, makeState({ species: "yuki", lockedSpecies: "" }, config));
    const unlocked = loadState(NOW, config, unlockedPath);
    assert.equal(unlocked.species, "nari");
  });
});

test("loadState clamps out-of-range stats and falls back for unusable stats", () => {
  withTempDir((dir) => {
    const path = join(dir, "state.json");
    const config = makeConfig({ economy: { startFullness: 60 } });
    const raw = JSON.stringify(
      {
        ...makeState({}, config),
        fullness: 150,
        happiness: 0,
        stamina: -3,
      },
      null,
      2
    ).replace('"happiness": 0', '"happiness": 1e999');
    writeText(path, `${raw}\n`);

    const state = loadState(NOW, config, path);
    assert.equal(state.fullness, 100);
    assert.equal(state.happiness, 60);
    assert.equal(state.stamina, 0);
  });
});
