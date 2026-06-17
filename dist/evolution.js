"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stageFor = stageFor;
exports.daysToNextStage = daysToNextStage;
exports.isStageUnlocked = isStageUnlocked;
exports.laterStage = laterStage;
exports.pickSpecies = pickSpecies;
exports.resolveEvolution = resolveEvolution;
const sprites_1 = require("./sprites");
/** Age in days at which each stage begins. */
const STAGE_THRESHOLDS = [
    { stage: "egg", days: 0 },
    { stage: "baby", days: 1 },
    { stage: "child", days: 3 },
    { stage: "teen", days: 7 },
    { stage: "adult", days: 14 },
];
function stageFor(ageDays) {
    let result = "egg";
    for (const { stage, days } of STAGE_THRESHOLDS) {
        if (ageDays >= days)
            result = stage;
    }
    return result;
}
/** Whole days until the next stage, or null if already adult. */
function daysToNextStage(ageDays) {
    for (const { days } of STAGE_THRESHOLDS) {
        if (ageDays < days)
            return Math.ceil(days - ageDays);
    }
    return null;
}
function stageRank(stage) {
    return STAGE_THRESHOLDS.findIndex((entry) => entry.stage === stage);
}
function isStageUnlocked(stage, maxStage) {
    return stageRank(stage) <= stageRank(maxStage);
}
function laterStage(a, b) {
    return stageRank(a) >= stageRank(b) ? a : b;
}
/** Parked hook for future special/limited character selection rules. */
function pickSpecies(_a, _neglectDays) {
    return sprites_1.DEFAULT_SPECIES;
}
/**
 * Resolve the pet's stage, active character, and neglect variant for this tick.
 *
 * Rules:
 *  - Stage advances purely with age.
 *  - Before adulthood, config.character is the active character.
 *  - At adulthood, the current active character is locked.
 *  - After adulthood, the lock wins over later config changes.
 */
function resolveEvolution(a, ageDays, prevLocked, neglectDays, activeCharacter) {
    const stage = stageFor(ageDays);
    const neglected = a.daysSinceLastContribution >= neglectDays;
    if (prevLocked) {
        return { stage, species: prevLocked, isGhost: neglected, lockedSpecies: prevLocked };
    }
    const candidate = activeCharacter;
    if (stage === "adult") {
        return { stage, species: candidate, isGhost: neglected, lockedSpecies: candidate };
    }
    return { stage, species: candidate, isGhost: neglected, lockedSpecies: "" };
}
