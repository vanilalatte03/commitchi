"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VISITOR_ACTION_BONUS = void 0;
exports.loadState = loadState;
exports.saveState = saveState;
exports.getActivePet = getActivePet;
exports.setActivePet = setActivePet;
exports.applyTick = applyTick;
exports.applyVisitorInteraction = applyVisitorInteraction;
const node_fs_1 = require("node:fs");
const evolution_1 = require("./evolution");
const i18n_1 = require("./i18n");
const sprites_1 = require("./sprites");
const characters_1 = require("./characters");
const STATE_PATH = "pet-state.json";
const LEGACY_GHOST_SPECIES = "ghost";
const DAY_MS = 86_400_000;
const STREAK_MILESTONES = [7, 30, 100];
const BURST_PENALTY_CAP = 14;
const NOTE_LOG_LIMIT = 8;
const COLLAB_NOTE_THRESHOLD = 0.34;
const REASON_CODES = [
    "ghost_neglect",
    "sick_exhausted",
    "sick_starving",
    "sick_lonely",
    "hungry",
    "happy_collab",
    "happy_active",
    "content",
];
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
exports.VISITOR_ACTION_BONUS = {
    feed: { fullness: 10, happiness: 2, stamina: 0 },
    play: { fullness: 2, happiness: 8, stamina: 2 },
};
function normalizeStat(value, fallback) {
    return typeof value === "number" && Number.isFinite(value)
        ? Math.round(clamp(value, 0, 100))
        : fallback;
}
function normalizeMilestones(value) {
    if (!Array.isArray(value))
        return [];
    return [...new Set(value.filter((item) => typeof item === "string"))];
}
function isLegacyGhostSpecies(value) {
    return typeof value === "string" && value.trim() === LEGACY_GHOST_SPECIES;
}
function isRegisteredSpecies(species) {
    try {
        (0, characters_1.getCharacter)(species);
        return true;
    }
    catch (error) {
        if (!(error instanceof Error) || !error.message.includes(`unknown character "${species}"`)) {
            throw error;
        }
        return false;
    }
}
function normalizeGhostVariant(value, legacySpecies) {
    if (typeof value === "boolean")
        return value;
    return isLegacyGhostSpecies(legacySpecies);
}
function normalizeLockedSpecies(value) {
    const species = typeof value === "string" ? value.trim() : "";
    if (!species)
        return "";
    if (isLegacyGhostSpecies(species))
        return sprites_1.DEFAULT_SPECIES;
    return isRegisteredSpecies(species) ? species : sprites_1.DEFAULT_SPECIES;
}
function normalizeSpeciesId(value) {
    const species = typeof value === "string" ? value.trim() : "";
    if (!species || isLegacyGhostSpecies(species))
        return null;
    return isRegisteredSpecies(species) ? species : null;
}
function normalizeStage(value, fallback) {
    return value === "egg" ||
        value === "baby" ||
        value === "child" ||
        value === "teen" ||
        value === "adult"
        ? value
        : fallback;
}
function normalizeMood(value, fallback) {
    return value === "happy" || value === "hungry" || value === "sick" ? value : fallback;
}
function isReasonCode(value) {
    return typeof value === "string" && REASON_CODES.includes(value);
}
function normalizeText(value, fallback) {
    const text = typeof value === "string" ? value.trim() : "";
    return text || fallback;
}
function normalizeCount(value) {
    return typeof value === "number" && Number.isFinite(value)
        ? Math.max(0, Math.floor(value))
        : 0;
}
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function normalizeVisitorInteractions(value) {
    if (!isRecord(value))
        return {};
    const result = {};
    for (const [rawKey, rawRecord] of Object.entries(value)) {
        if (!isRecord(rawRecord))
            continue;
        const key = rawKey.trim().toLowerCase();
        const lastInteractionDate = rawRecord.lastInteractionDate;
        if (!key || typeof lastInteractionDate !== "string")
            continue;
        result[key] = {
            lastInteractionDate,
            totalInteractions: typeof rawRecord.totalInteractions === "number" && Number.isFinite(rawRecord.totalInteractions)
                ? Math.max(0, Math.floor(rawRecord.totalInteractions))
                : 1,
            feedCount: typeof rawRecord.feedCount === "number" && Number.isFinite(rawRecord.feedCount)
                ? Math.max(0, Math.floor(rawRecord.feedCount))
                : 0,
            playCount: typeof rawRecord.playCount === "number" && Number.isFinite(rawRecord.playCount)
                ? Math.max(0, Math.floor(rawRecord.playCount))
                : 0,
        };
    }
    return result;
}
function contentNote(now) {
    return { code: "content", days: 0, at: now.toISOString() };
}
function normalizeStateNote(value, fallback) {
    if (!isRecord(value))
        return fallback;
    return {
        code: isReasonCode(value.code) ? value.code : fallback.code,
        days: normalizeCount(value.days),
        at: normalizeText(value.at, fallback.at),
    };
}
function normalizeLog(value, fallbackAt) {
    if (!Array.isArray(value))
        return [];
    const log = [];
    for (const item of value) {
        if (!isRecord(item) || !isReasonCode(item.code))
            continue;
        log.push({
            code: item.code,
            days: normalizeCount(item.days),
            at: normalizeText(item.at, fallbackAt),
        });
    }
    return log.slice(-NOTE_LOG_LIMIT);
}
function freshPet(now, config, species) {
    const iso = now.toISOString();
    const note = contentNote(now);
    return {
        name: config.petName,
        species,
        isGhost: false,
        lockedSpecies: "",
        stage: "egg",
        bornAt: iso,
        lastTickAt: iso,
        fullness: config.economy.startFullness,
        happiness: config.economy.startFullness,
        stamina: config.economy.startFullness,
        mood: "happy",
        note,
        log: [],
        celebration: null,
        celebratedMilestones: [],
        ageDays: 0,
        lastDayDate: "",
        lastDayCounted: 0,
        visitorInteractions: {},
    };
}
function normalizePetState(value, now, config, rosterSpecies, isActive) {
    if (!isRecord(value))
        return freshPet(now, config, rosterSpecies);
    const fallback = freshPet(now, config, rosterSpecies);
    const lockedSpecies = normalizeLockedSpecies(value.lockedSpecies);
    const bornAt = normalizeText(value.bornAt, fallback.bornAt);
    const note = normalizeStateNote(value.note, fallback.note ?? contentNote(now));
    const lastTickAt = normalizeText(value.lastTickAt, fallback.lastTickAt);
    return {
        name: isActive ? config.petName : normalizeText(value.name, config.petName),
        species: lockedSpecies || rosterSpecies,
        isGhost: normalizeGhostVariant(value.isGhost, value.species),
        lockedSpecies,
        stage: normalizeStage(value.stage, fallback.stage),
        bornAt,
        lastTickAt,
        fullness: normalizeStat(value.fullness, config.economy.startFullness),
        happiness: normalizeStat(value.happiness, config.economy.startFullness),
        stamina: normalizeStat(value.stamina, config.economy.startFullness),
        mood: normalizeMood(value.mood, fallback.mood),
        note,
        log: normalizeLog(value.log, lastTickAt),
        celebration: null,
        celebratedMilestones: normalizeMilestones(value.celebratedMilestones),
        ageDays: normalizeCount(value.ageDays),
        lastDayDate: typeof value.lastDayDate === "string" ? value.lastDayDate : "",
        lastDayCounted: normalizeCount(value.lastDayCounted),
        visitorInteractions: normalizeVisitorInteractions(value.visitorInteractions),
    };
}
function legacyRosterSpecies(value) {
    const lockedSpecies = normalizeLockedSpecies(value.lockedSpecies);
    if (lockedSpecies)
        return lockedSpecies;
    return normalizeSpeciesId(value.species) ?? sprites_1.DEFAULT_SPECIES;
}
function dexEntryForPet(pet, existing) {
    return {
        firstSeenAt: existing?.firstSeenAt ?? pet.bornAt,
        maxStage: existing ? (0, evolution_1.laterStage)(existing.maxStage, pet.stage) : pet.stage,
    };
}
function normalizeDex(value, pets, now) {
    const fallbackIso = now.toISOString();
    const dex = {};
    if (isRecord(value)) {
        for (const [rawSpecies, rawEntry] of Object.entries(value)) {
            const species = normalizeSpeciesId(rawSpecies);
            if (!species)
                continue;
            const pet = pets[species];
            const fallbackStage = pet?.stage ?? "egg";
            const fallbackFirstSeenAt = pet?.bornAt ?? fallbackIso;
            if (!isRecord(rawEntry)) {
                dex[species] = { firstSeenAt: fallbackFirstSeenAt, maxStage: fallbackStage };
                continue;
            }
            dex[species] = {
                firstSeenAt: normalizeText(rawEntry.firstSeenAt, fallbackFirstSeenAt),
                maxStage: normalizeStage(rawEntry.maxStage, fallbackStage),
            };
        }
    }
    for (const [species, pet] of Object.entries(pets)) {
        dex[species] = dexEntryForPet(pet, dex[species]);
    }
    return dex;
}
function migrateLegacyState(value, now, config) {
    const active = config.character;
    const species = legacyRosterSpecies(value);
    const pets = {
        [species]: normalizePetState(value, now, config, species, species === active),
    };
    if (!pets[active]) {
        pets[active] = freshPet(now, config, active);
    }
    return {
        schemaVersion: 2,
        active,
        pets,
        dex: normalizeDex(undefined, pets, now),
    };
}
function normalizeSaveState(value, now, config) {
    const previousActive = normalizeSpeciesId(value.active);
    const active = config.character;
    const pets = {};
    const rawPets = value.pets;
    if (isRecord(rawPets)) {
        for (const [rawSpecies, rawPet] of Object.entries(rawPets)) {
            const species = normalizeSpeciesId(rawSpecies);
            if (!species)
                continue;
            pets[species] = normalizePetState(rawPet, now, config, species, species === active);
        }
    }
    const activeCreated = !pets[active];
    if (activeCreated) {
        pets[active] = freshPet(now, config, active);
    }
    else {
        pets[active] = {
            ...pets[active],
            name: config.petName,
            species: pets[active].lockedSpecies || active,
        };
    }
    if (activeCreated || previousActive !== active) {
        pets[active] = { ...pets[active], lastTickAt: now.toISOString() };
    }
    return {
        schemaVersion: 2,
        active,
        pets,
        dex: normalizeDex(value.dex, pets, now),
    };
}
function loadState(now, config, path = STATE_PATH) {
    if (!(0, node_fs_1.existsSync)(path)) {
        const active = config.character;
        const pets = { [active]: freshPet(now, config, active) };
        return {
            schemaVersion: 2,
            active,
            pets,
            dex: normalizeDex(undefined, pets, now),
        };
    }
    const parsed = JSON.parse((0, node_fs_1.readFileSync)(path, "utf8"));
    if (!isRecord(parsed)) {
        const active = config.character;
        const pets = { [active]: freshPet(now, config, active) };
        return {
            schemaVersion: 2,
            active,
            pets,
            dex: normalizeDex(undefined, pets, now),
        };
    }
    return parsed.schemaVersion === 2
        ? normalizeSaveState(parsed, now, config)
        : migrateLegacyState(parsed, now, config);
}
function saveState(state, path = STATE_PATH) {
    (0, node_fs_1.writeFileSync)(path, JSON.stringify(state, null, 2) + "\n");
}
function getActivePet(save) {
    const pet = save.pets[save.active];
    if (!pet)
        throw new Error(`pet-state.json: active pet "${save.active}" is missing.`);
    return pet;
}
function setActivePet(save, pet) {
    const existing = save.dex[save.active];
    return {
        ...save,
        pets: {
            ...save.pets,
            [save.active]: pet,
        },
        dex: {
            ...save.dex,
            [save.active]: dexEntryForPet(pet, existing),
        },
    };
}
function moodFor(fullness, happiness, stamina, daysSinceLastContribution, config) {
    const lowestStat = Math.min(fullness, happiness, stamina);
    if (daysSinceLastContribution >= config.thresholds.neglectDays ||
        lowestStat <= config.thresholds.sickFullness ||
        stamina <= config.thresholds.sickStamina) {
        return "sick";
    }
    if (fullness <= config.thresholds.hungryFullness)
        return "hungry";
    return "happy";
}
function appendLog(previous, note) {
    const log = previous ?? [];
    if (log.at(-1)?.code === note.code)
        return log;
    return [...log, note].slice(-NOTE_LOG_LIMIT);
}
function deriveNote(mood, isGhost, activity, stats, config, now) {
    let code;
    if (isGhost) {
        code = "ghost_neglect";
    }
    else if (mood === "sick") {
        if (stats.stamina <= config.thresholds.sickStamina) {
            code = "sick_exhausted";
        }
        else if (stats.fullness <= config.thresholds.sickFullness) {
            code = "sick_starving";
        }
        else {
            code = "sick_lonely";
        }
    }
    else if (mood === "hungry") {
        code = "hungry";
    }
    else if (activity.newContribs > 0) {
        code = activity.collabRatio >= COLLAB_NOTE_THRESHOLD ? "happy_collab" : "happy_active";
    }
    else {
        code = "content";
    }
    return {
        code,
        days: normalizeCount(activity.daysSinceLastContribution),
        at: now.toISOString(),
    };
}
function evolutionCelebration(stage, s) {
    if (stage === "egg")
        return null;
    const { title, detail } = s.evolutionCelebration(s.stage[stage]);
    return {
        kind: "evolution",
        milestoneId: `evolution:${stage}`,
        title,
        detail,
    };
}
function streakCelebration(streak, seen, s) {
    const newest = [...STREAK_MILESTONES]
        .reverse()
        .find((days) => streak >= days && !seen.has(`streak:${days}`));
    if (!newest)
        return null;
    const { title, detail } = s.streakCelebration(newest);
    return {
        kind: "streak",
        milestoneId: `streak:${newest}`,
        title,
        detail,
    };
}
function resolveCelebration(previous, nextStage, streak, s) {
    const seen = new Set(previous.celebratedMilestones);
    if (previous.stage !== nextStage) {
        const celebration = evolutionCelebration(nextStage, s);
        if (celebration && !seen.has(celebration.milestoneId)) {
            seen.add(celebration.milestoneId);
            return { celebration, celebratedMilestones: [...seen] };
        }
    }
    const celebration = streakCelebration(streak, seen, s);
    if (celebration) {
        const days = Number(celebration.milestoneId.split(":")[1]);
        for (const milestone of STREAK_MILESTONES) {
            if (milestone <= days)
                seen.add(`streak:${milestone}`);
        }
        return { celebration, celebratedMilestones: [...seen] };
    }
    return { celebration: null, celebratedMilestones: [...seen] };
}
function stableIndex(seed, length) {
    let hash = 0;
    for (const ch of seed) {
        hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    }
    return hash % length;
}
function visitorCelebration(action, actor, today, s) {
    const titles = s.visitorReactionTitles[action];
    const title = titles[stableIndex(`${action}:${actor}:${today}`, titles.length)];
    const bonus = action === "feed" ? exports.VISITOR_ACTION_BONUS.feed.fullness : exports.VISITOR_ACTION_BONUS.play.happiness;
    const detail = s.visitorCelebrationDetail(action, actor, bonus);
    return {
        kind: "visitor",
        milestoneId: `visitor:${action}:${today}:${actor}`,
        title,
        detail,
    };
}
/**
 * Decay stats by the time elapsed since the last tick. Returns the (unclamped)
 * decayed values so callers can add their own gains before clamping. Shared by
 * applyTick and visitor interactions so both advance state to `now` consistently.
 */
function decayStats(state, now, config) {
    const elapsedDays = Math.max(0, (now.getTime() - new Date(state.lastTickAt).getTime()) / DAY_MS);
    return {
        elapsedDays,
        fullness: state.fullness - config.economy.decayPerDay * elapsedDays,
        happiness: state.happiness - config.economy.happinessDecayPerDay * elapsedDays,
        stamina: state.stamina - config.economy.staminaDecayPerDay * elapsedDays,
    };
}
/** Advance the pet one tick: feed, decay, age, and evolve. Returns the new state. */
function applyTick(state, a, now, config) {
    const decayed = decayStats(state, now, config);
    // Feed only on contributions we haven't already counted (handles multiple ticks/day).
    const newContribs = a.todayDate !== state.lastDayDate
        ? a.todayCount
        : Math.max(0, a.todayCount - state.lastDayCounted);
    const fullness = clamp(decayed.fullness + newContribs * config.economy.feedPerContrib, 0, 100);
    // Happiness rises with activity (so a solo committer can max it) plus a
    // collaboration bonus on top; collaborators climb faster, but no one is gated.
    const happinessGain = newContribs > 0 ? newContribs * (4 + a.collabRatio * 4) : 0;
    const happiness = clamp(decayed.happiness + happinessGain, 0, 100);
    // Stamina mirrors consistency: a longer streak lifts it more, and it sags when
    // the streak is short or broken (decay now meaningfully outpaces a single day).
    const consistencyGain = newContribs > 0 ? 4 + Math.min(16, Math.max(0, a.streak)) : 0;
    const burstPenalty = Math.min(BURST_PENALTY_CAP, Math.max(0, newContribs - 6) * 2);
    const stamina = clamp(decayed.stamina + consistencyGain - burstPenalty, 0, 100);
    const ageDays = Math.floor((now.getTime() - new Date(state.bornAt).getTime()) / DAY_MS);
    const evo = (0, evolution_1.resolveEvolution)(a, ageDays, state.lockedSpecies, config.thresholds.neglectDays, config.character);
    const celebration = evo.isGhost
        ? { celebration: null, celebratedMilestones: state.celebratedMilestones }
        : resolveCelebration(state, evo.stage, a.streak, (0, i18n_1.getStrings)(config.language));
    const nextMood = moodFor(fullness, happiness, stamina, a.daysSinceLastContribution, config);
    const note = deriveNote(nextMood, evo.isGhost, {
        daysSinceLastContribution: a.daysSinceLastContribution,
        newContribs,
        collabRatio: a.collabRatio,
    }, { fullness, happiness, stamina }, config, now);
    return {
        ...state,
        name: config.petName,
        fullness: Math.round(fullness),
        happiness: Math.round(happiness),
        stamina: Math.round(stamina),
        mood: nextMood,
        note,
        log: appendLog(state.log, note),
        celebration: celebration.celebration,
        celebratedMilestones: celebration.celebratedMilestones,
        ageDays,
        stage: evo.stage,
        species: evo.species,
        isGhost: evo.isGhost,
        lockedSpecies: evo.lockedSpecies,
        lastDayDate: a.todayDate,
        lastDayCounted: a.todayCount,
        lastTickAt: now.toISOString(),
    };
}
function moodAfterVisitorInteraction(state, fullness, happiness, stamina, config) {
    if (state.isGhost)
        return "sick";
    return moodFor(fullness, happiness, stamina, 0, config);
}
/** Apply a visitor issue-op action. Visitors may help at most once per UTC day. */
function applyVisitorInteraction(state, action, actor, now, config) {
    const actorKey = actor.trim().toLowerCase();
    if (!actorKey)
        throw new Error("Visitor interaction requires a GitHub actor.");
    const today = now.toISOString().slice(0, 10);
    const previous = state.visitorInteractions[actorKey];
    if (previous?.lastInteractionDate === today) {
        return { state, applied: false, reason: "rate_limited", action, actor: actorKey };
    }
    const bonus = exports.VISITOR_ACTION_BONUS[action];
    // Decay elapsed time first so a visit can't erase pending hunger/happiness/stamina loss.
    const decayed = decayStats(state, now, config);
    const fullness = clamp(decayed.fullness + bonus.fullness, 0, 100);
    const happiness = clamp(decayed.happiness + bonus.happiness, 0, 100);
    const stamina = clamp(decayed.stamina + bonus.stamina, 0, 100);
    const visitorInteractions = {
        ...state.visitorInteractions,
        [actorKey]: {
            lastInteractionDate: today,
            totalInteractions: (previous?.totalInteractions ?? 0) + 1,
            feedCount: (previous?.feedCount ?? 0) + (action === "feed" ? 1 : 0),
            playCount: (previous?.playCount ?? 0) + (action === "play" ? 1 : 0),
        },
    };
    const nextMood = moodAfterVisitorInteraction(state, fullness, happiness, stamina, config);
    const note = deriveNote(nextMood, state.isGhost, { daysSinceLastContribution: 0, newContribs: 0, collabRatio: 0 }, { fullness, happiness, stamina }, config, now);
    return {
        state: {
            ...state,
            name: config.petName,
            fullness: Math.round(fullness),
            happiness: Math.round(happiness),
            stamina: Math.round(stamina),
            mood: nextMood,
            note,
            log: appendLog(state.log, note),
            celebration: visitorCelebration(action, actorKey, today, (0, i18n_1.getStrings)(config.language)),
            visitorInteractions,
            lastTickAt: now.toISOString(),
        },
        applied: true,
        reason: "applied",
        action,
        actor: actorKey,
    };
}
