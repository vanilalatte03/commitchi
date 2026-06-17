import assert from "node:assert/strict";
import { join } from "node:path";
import { test } from "node:test";
import {
  applyTick,
  applyVisitorInteraction,
  getActivePet,
  loadState,
  setActivePet,
  VISITOR_ACTION_BONUS,
} from "../src/state";
import {
  makeActivity,
  makeConfig,
  makeSave,
  makeState,
  withTempDir,
  writeJson,
  writeText,
} from "./helpers";
import type { StateNote } from "../src/types";

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
  // happiness: 50 + 2 * (4 + 0.5 * 4) = 62
  assert.equal(first.happiness, 62);
  // stamina: 50 + (4 + min(16, streak 1)) = 55
  assert.equal(first.stamina, 55);
  assert.equal(first.lastDayCounted, 2);

  const second = applyTick(first, activity, NOW, config);
  assert.equal(second.fullness, first.fullness);
  assert.equal(second.happiness, first.happiness);
  assert.equal(second.stamina, first.stamina);
  assert.equal(second.lastDayCounted, 2);
});

test("applyTick lets a solo committer climb happiness; stamina scales with streak", () => {
  const config = makeConfig({
    economy: {
      feedPerContrib: 0,
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
  const solo = makeActivity({
    todayDate: "2026-01-15",
    todayCount: 3,
    streak: 5,
    collabRatio: 0,
  });

  const next = applyTick(state, solo, NOW, config);
  // happiness rises on activity alone: 50 + 3 * (4 + 0 * 4) = 62 (collab only adds on top)
  assert.equal(next.happiness, 62);
  // stamina tracks the streak: 50 + (4 + min(16, streak 5)) = 59
  assert.equal(next.stamina, 59);
});

test("applyTick caps burst stamina penalty on high-contribution days", () => {
  const config = makeConfig({
    economy: {
      feedPerContrib: 0,
      decayPerDay: 0,
      happinessDecayPerDay: 0,
      staminaDecayPerDay: 0,
    },
  });
  const state = makeState(
    {
      fullness: 80,
      happiness: 80,
      stamina: 50,
      lastTickAt: NOW.toISOString(),
      lastDayDate: "2026-01-14",
      lastDayCounted: 0,
    },
    config
  );
  const activity = makeActivity({
    todayDate: "2026-01-15",
    todayCount: 52,
    streak: 30,
  });

  const next = applyTick(state, activity, NOW, config);

  // stamina: 50 + (4 + min(16, streak 30)) - min(14, (52-6)*2) = 50 + 20 - 14 = 56
  assert.equal(next.stamina, 56);
  assert.ok(next.stamina > state.stamina);
  assert.notEqual(next.mood, "sick");
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

  const tiredButHealthy = applyTick(
    makeState({ fullness: 100, happiness: 100, stamina: 31 }, config),
    makeActivity(),
    NOW,
    config
  );
  assert.equal(tiredButHealthy.mood, "happy");

  const sickByStamina = applyTick(
    makeState({ fullness: 100, happiness: 100, stamina: 30 }, config),
    makeActivity(),
    NOW,
    config
  );
  assert.equal(sickByStamina.mood, "sick");

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

test("applyTick records reason notes for mood causes", () => {
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
      sickStamina: 30,
      neglectDays: 4,
    },
  });

  const hungry = applyTick(
    makeState({ fullness: 45, happiness: 80, stamina: 80 }, config),
    makeActivity({ daysSinceLastContribution: 2 }),
    NOW,
    config
  );
  assert.equal(hungry.note?.code, "hungry");
  assert.equal(hungry.note?.days, 2);

  const exhausted = applyTick(
    makeState({ fullness: 100, happiness: 100, stamina: 30 }, config),
    makeActivity(),
    NOW,
    config
  );
  assert.equal(exhausted.note?.code, "sick_exhausted");

  const starving = applyTick(
    makeState({ fullness: 15, happiness: 80, stamina: 80 }, config),
    makeActivity(),
    NOW,
    config
  );
  assert.equal(starving.note?.code, "sick_starving");

  const lonely = applyTick(
    makeState({ fullness: 80, happiness: 15, stamina: 80 }, config),
    makeActivity(),
    NOW,
    config
  );
  assert.equal(lonely.note?.code, "sick_lonely");

  const ghost = applyTick(
    makeState({ fullness: 90, happiness: 90, stamina: 90 }, config),
    makeActivity({ daysSinceLastContribution: 4 }),
    NOW,
    config
  );
  assert.equal(ghost.isGhost, true);
  assert.equal(ghost.note?.code, "ghost_neglect");
  assert.equal(ghost.note?.days, 4);

  const collab = applyTick(
    makeState({ fullness: 90, happiness: 90, stamina: 90 }, config),
    makeActivity({ todayCount: 1, collabRatio: 0.5 }),
    NOW,
    config
  );
  assert.equal(collab.note?.code, "happy_collab");

  const active = applyTick(
    makeState({ fullness: 90, happiness: 90, stamina: 90 }, config),
    makeActivity({ todayCount: 1, collabRatio: 0 }),
    NOW,
    config
  );
  assert.equal(active.note?.code, "happy_active");

  const content = applyTick(
    makeState({ fullness: 90, happiness: 90, stamina: 90 }, config),
    makeActivity(),
    NOW,
    config
  );
  assert.equal(content.note?.code, "content");
});

test("applyTick appends reason changes without repeated same-code entries and caps log", () => {
  const config = makeConfig({
    economy: {
      feedPerContrib: 0,
      decayPerDay: 0,
      happinessDecayPerDay: 0,
      staminaDecayPerDay: 0,
    },
  });
  const base = makeState({ fullness: 90, happiness: 90, stamina: 90, log: [] }, config);

  const first = applyTick(base, makeActivity(), NOW, config);
  assert.equal(first.note?.code, "content");
  assert.equal(first.log?.length, 1);

  const second = applyTick(first, makeActivity({ todayDate: "2026-01-16" }), NOW, config);
  assert.equal(second.note?.code, "content");
  assert.equal(second.log?.length, 1);

  const third = applyTick(
    second,
    makeActivity({ todayDate: "2026-01-17", todayCount: 1 }),
    NOW,
    config
  );
  assert.equal(third.note?.code, "happy_active");
  assert.deepEqual(
    third.log?.map((note) => note.code),
    ["content", "happy_active"]
  );

  const fullLog: StateNote[] = ([
    "ghost_neglect",
    "sick_exhausted",
    "sick_starving",
    "sick_lonely",
    "hungry",
    "happy_collab",
    "happy_active",
    "content",
  ] as StateNote["code"][]).map((code, index) => ({ code, days: index, at: daysBefore(8 - index) }));
  const capped = applyTick(
    makeState({ fullness: 45, happiness: 90, stamina: 90, log: fullLog }, config),
    makeActivity({ daysSinceLastContribution: 1 }),
    NOW,
    config
  );

  assert.equal(capped.note?.code, "hungry");
  assert.equal(capped.log?.length, 8);
  assert.equal(capped.log?.[0].code, "sick_exhausted");
  assert.equal(capped.log?.[7].code, "hungry");
});

test("applyTick honors a custom sickStamina threshold", () => {
  const config = makeConfig({
    economy: {
      feedPerContrib: 0,
      decayPerDay: 0,
      happinessDecayPerDay: 0,
      staminaDecayPerDay: 0,
    },
    thresholds: { sickStamina: 50 },
  });

  // stamina 45 (<= custom 50) → sick, even with full fullness/happiness
  const sick = applyTick(
    makeState({ fullness: 100, happiness: 100, stamina: 45 }, config),
    makeActivity(),
    NOW,
    config
  );
  assert.equal(sick.mood, "sick");

  // stamina 55 (> 50) → not sick
  const ok = applyTick(
    makeState({ fullness: 100, happiness: 100, stamina: 55 }, config),
    makeActivity(),
    NOW,
    config
  );
  assert.equal(ok.mood, "happy");
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

test("applyVisitorInteraction refreshes note and appends log", () => {
  const config = makeConfig({
    economy: {
      decayPerDay: 0,
      happinessDecayPerDay: 0,
      staminaDecayPerDay: 0,
    },
  });
  const hungryNote: StateNote = { code: "hungry", days: 2, at: daysBefore(2) };
  const base = makeState(
    {
      fullness: 45,
      happiness: 80,
      stamina: 80,
      mood: "hungry",
      note: hungryNote,
      log: [hungryNote],
    },
    config
  );

  const update = applyVisitorInteraction(base, "feed", "Alice", NOW, config);

  assert.equal(update.applied, true);
  assert.equal(update.state.mood, "happy");
  assert.equal(update.state.note?.code, "content");
  assert.equal(update.state.note?.days, 0);
  assert.deepEqual(
    update.state.log?.map((note) => note.code),
    ["hungry", "content"]
  );
});

test("applyVisitorInteraction marks a full pet sick when stamina is 30 or below", () => {
  const config = makeConfig({
    economy: {
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
  const state = makeState(
    {
      fullness: 100,
      happiness: 100,
      stamina: 28,
      lastTickAt: NOW.toISOString(),
    },
    config
  );

  const update = applyVisitorInteraction(state, "feed", "Alice", NOW, config);
  assert.equal(update.state.fullness, 100);
  assert.equal(update.state.happiness, 100);
  assert.equal(update.state.stamina, 28);
  assert.equal(update.state.mood, "sick");
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
  // decay 1 day (fullness -10, happiness -5, stamina -4) then feed bonus (+10/+2/+0)
  assert.equal(update.state.fullness, 50);
  assert.equal(update.state.happiness, 47);
  assert.equal(update.state.stamina, 46);
});

test("loadState returns a fresh egg when the state file is missing", () => {
  withTempDir((dir) => {
    const path = join(dir, "missing-state.json");
    const config = makeConfig({ petName: "Nova", character: "nari" });

    const save = loadState(NOW, config, path);
    const state = getActivePet(save);
    assert.equal(save.schemaVersion, 2);
    assert.equal(save.active, "nari");
    assert.equal(state.name, "Nova");
    assert.equal(state.species, "nari");
    assert.equal(state.stage, "egg");
    assert.equal(state.isGhost, false);
    assert.equal(state.bornAt, NOW.toISOString());
    assert.equal(state.lastTickAt, NOW.toISOString());
    assert.deepEqual(state.note, { code: "content", days: 0, at: NOW.toISOString() });
    assert.deepEqual(state.log, []);
    assert.deepEqual(save.dex.nari, { firstSeenAt: NOW.toISOString(), maxStage: "egg" });
  });
});

test("loadState normalizes legacy ghost species to ghost variant on the configured species", () => {
  withTempDir((dir) => {
    const path = join(dir, "state.json");
    const config = makeConfig({ character: "yuki" });
    const legacy: Record<string, unknown> = {
      ...makeState({ species: "ghost" }, config),
      species: "ghost",
    };
    delete legacy.isGhost;
    writeJson(path, legacy);

    const save = loadState(NOW, config, path);
    const state = getActivePet(save);
    assert.equal(state.species, "yuki");
    assert.equal(state.isGhost, true);
  });
});

test("loadState migrates legacy locked pets without replacing them with the configured character", () => {
  withTempDir((dir) => {
    const config = makeConfig({ character: "nari" });
    const lockedPath = join(dir, "locked.json");
    writeJson(lockedPath, makeState({ species: "nari", lockedSpecies: "yuki" }, config));

    const locked = loadState(NOW, config, lockedPath);
    assert.equal(locked.active, "nari");
    assert.equal(getActivePet(locked).species, "nari");
    assert.equal(getActivePet(locked).stage, "egg");
    assert.equal(locked.pets.yuki.species, "yuki");
    assert.equal(locked.pets.yuki.lockedSpecies, "yuki");

    const unlockedPath = join(dir, "unlocked.json");
    writeJson(unlockedPath, makeState({ species: "yuki", lockedSpecies: "" }, config));
    const unlocked = loadState(NOW, config, unlockedPath);
    assert.equal(unlocked.active, "nari");
    assert.equal(getActivePet(unlocked).species, "nari");
    assert.equal(unlocked.pets.yuki.species, "yuki");
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

    const state = getActivePet(loadState(NOW, config, path));
    assert.equal(state.fullness, 100);
    assert.equal(state.happiness, 60);
    assert.equal(state.stamina, 0);
  });
});

test("loadState normalizes note and log fields", () => {
  withTempDir((dir) => {
    const path = join(dir, "state.json");
    const config = makeConfig();
    const raw = {
      ...makeState({}, config),
      note: { code: "hungry", days: 2.8, at: "2026-01-14T00:00:00.000Z" },
      log: [
        { code: "unknown", days: 9, at: "2026-01-10T00:00:00.000Z" },
        { code: "happy_active", days: 1.8, at: "" },
      ],
    };
    writeJson(path, raw);

    const state = getActivePet(loadState(NOW, config, path));

    assert.deepEqual(state.note, {
      code: "hungry",
      days: 2,
      at: "2026-01-14T00:00:00.000Z",
    });
    assert.deepEqual(state.log, [
      { code: "happy_active", days: 1, at: raw.lastTickAt },
    ]);
  });
});

test("loadState migrates v1 state into a v2 roster without resetting the existing pet", () => {
  withTempDir((dir) => {
    const path = join(dir, "state.json");
    const config = makeConfig({ character: "yuki" });
    const legacy = makeState(
      {
        stage: "child",
        bornAt: daysBefore(5),
        lastTickAt: daysBefore(1),
        fullness: 33,
        happiness: 44,
        stamina: 55,
        ageDays: 5,
      },
      config
    );
    writeJson(path, legacy);

    const save = loadState(NOW, config, path);
    const pet = getActivePet(save);
    assert.equal(save.schemaVersion, 2);
    assert.equal(save.active, "yuki");
    assert.equal(pet.stage, "child");
    assert.equal(pet.fullness, 33);
    assert.equal(pet.happiness, 44);
    assert.equal(pet.stamina, 55);
    assert.equal(pet.bornAt, daysBefore(5));
    assert.equal(pet.lastTickAt, daysBefore(1));
    assert.deepEqual(save.dex.yuki, {
      firstSeenAt: daysBefore(5),
      maxStage: "child",
    });
  });
});

test("loadState switches to a frozen roster pet without catch-up decay", () => {
  withTempDir((dir) => {
    const path = join(dir, "state.json");
    const config = makeConfig({
      character: "nari",
      economy: {
        feedPerContrib: 0,
        decayPerDay: 10,
        happinessDecayPerDay: 10,
        staminaDecayPerDay: 10,
      },
    });
    const yuki = makeState(
      { species: "yuki", stage: "child", fullness: 40, lastTickAt: daysBefore(2) },
      makeConfig({ character: "yuki" })
    );
    const nari = makeState(
      { species: "nari", stage: "baby", fullness: 77, lastTickAt: daysBefore(9) },
      config
    );
    writeJson(
      path,
      makeSave(
        {
          active: "yuki",
          pets: { yuki, nari },
          dex: {
            yuki: { firstSeenAt: yuki.bornAt, maxStage: "child" },
            nari: { firstSeenAt: nari.bornAt, maxStage: "baby" },
          },
        },
        makeConfig({ character: "yuki" })
      )
    );

    const save = loadState(NOW, config, path);
    const active = getActivePet(save);
    assert.equal(save.active, "nari");
    assert.equal(active.stage, "baby");
    assert.equal(active.fullness, 77);
    assert.equal(active.lastTickAt, NOW.toISOString());
    assert.equal(save.pets.yuki.fullness, 40);
    assert.equal(save.pets.yuki.lastTickAt, daysBefore(2));

    const ticked = applyTick(active, makeActivity({ todayDate: "2026-01-16" }), NOW, config);
    assert.equal(ticked.fullness, 77);
  });
});

test("inactive roster pets do not decay when only the active pet is ticked", () => {
  const config = makeConfig({
    character: "yuki",
    economy: {
      feedPerContrib: 0,
      decayPerDay: 10,
      happinessDecayPerDay: 10,
      staminaDecayPerDay: 10,
    },
  });
  const active = makeState({ species: "yuki", fullness: 90, lastTickAt: daysBefore(1) }, config);
  const inactive = makeState(
    { species: "nari", fullness: 20, happiness: 21, stamina: 22, lastTickAt: daysBefore(30) },
    makeConfig({ character: "nari" })
  );
  const save = makeSave(
    {
      active: "yuki",
      pets: { yuki: active, nari: inactive },
    },
    config
  );

  const ticked = applyTick(getActivePet(save), makeActivity(), NOW, config);
  const next = setActivePet(save, ticked);
  assert.equal(next.pets.yuki.fullness, 80);
  assert.deepEqual(next.pets.nari, inactive);
});

test("setActivePet raises dex maxStage without replacing firstSeenAt or lowering progress", () => {
  const config = makeConfig({ character: "yuki" });
  const firstSeenAt = "2026-01-01T00:00:00.000Z";
  const save = makeSave(
    {
      active: "yuki",
      pets: { yuki: makeState({ stage: "baby" }, config) },
      dex: { yuki: { firstSeenAt, maxStage: "baby" } },
    },
    config
  );

  const raised = setActivePet(save, makeState({ stage: "teen" }, config));
  assert.deepEqual(raised.dex.yuki, { firstSeenAt, maxStage: "teen" });

  const lowered = setActivePet(raised, makeState({ stage: "child" }, config));
  assert.deepEqual(lowered.dex.yuki, { firstSeenAt, maxStage: "teen" });
});
