"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = require("node:fs");
const config_1 = require("./config");
const i18n_1 = require("./i18n");
const render_1 = require("./render");
const config = (0, config_1.loadConfig)();
const s = (0, i18n_1.getStrings)(config.language);
/** Generate the default mascot asset sheet into ./preview for eyeballing. */
const base = {
    name: config.petName,
    species: config.character,
    isGhost: false,
    lockedSpecies: "",
    stage: "adult",
    bornAt: "",
    lastTickAt: "",
    fullness: 80,
    happiness: 72,
    stamina: 76,
    mood: "happy",
    celebration: null,
    celebratedMilestones: [],
    ageDays: 18,
    lastDayDate: "",
    lastDayCounted: 0,
    visitorInteractions: {},
};
(0, node_fs_1.mkdirSync)("preview", { recursive: true });
const make = (file, over) => (0, node_fs_1.writeFileSync)(`preview/${file}.svg`, (0, render_1.renderSVG)({ ...base, ...over }, config));
const moods = ["happy", "hungry", "sick"];
const stages = [
    { stage: "egg", ageDays: 0, fullness: 60 },
    { stage: "baby", ageDays: 2, fullness: 70 },
    { stage: "child", ageDays: 5, fullness: 80 },
    { stage: "teen", ageDays: 10, fullness: 80 },
    { stage: "adult", ageDays: 20, fullness: 80 },
];
for (const s of stages) {
    make(`stage-${s.stage}`, { ...s, mood: "happy" });
    for (const m of moods) {
        make(`${s.stage}-${m}`, {
            ...s,
            mood: m,
            fullness: m === "sick" ? 10 : m === "hungry" ? 35 : s.fullness,
            happiness: m === "sick" ? 18 : m === "hungry" ? 42 : 72,
            stamina: m === "sick" ? 14 : m === "hungry" ? 44 : 76,
        });
    }
}
for (const m of moods) {
    make(`mood-${m}`, {
        stage: "adult",
        ageDays: 20,
        mood: m,
        fullness: m === "sick" ? 10 : m === "hungry" ? 35 : 80,
        happiness: m === "sick" ? 18 : m === "hungry" ? 42 : 72,
        stamina: m === "sick" ? 14 : m === "hungry" ? 44 : 76,
    });
}
make("neglect-ghost", {
    isGhost: true,
    stage: "adult",
    ageDays: 20,
    mood: "sick",
    fullness: 0,
    happiness: 20,
    stamina: 8,
});
make("celebration-streak", {
    stage: "adult",
    ageDays: 30,
    mood: "happy",
    fullness: 92,
    happiness: 88,
    stamina: 94,
    celebration: {
        kind: "streak",
        milestoneId: "streak:30",
        ...s.streakCelebration(30),
    },
    celebratedMilestones: ["streak:7", "streak:30"],
});
make("visitor-feed", {
    stage: "child",
    ageDays: 5,
    mood: "happy",
    fullness: 72,
    happiness: 64,
    stamina: 61,
    celebration: {
        kind: "visitor",
        milestoneId: "visitor:feed:preview:octocat",
        title: s.visitorReactionTitles.feed[0],
        detail: s.visitorCelebrationDetail("feed", "octocat", 18),
    },
});
make("visitor-play", {
    stage: "teen",
    ageDays: 10,
    mood: "happy",
    fullness: 58,
    happiness: 82,
    stamina: 66,
    celebration: {
        kind: "visitor",
        milestoneId: "visitor:play:preview:octocat",
        title: s.visitorReactionTitles.play[0],
        detail: s.visitorCelebrationDetail("play", "octocat", 16),
    },
});
console.log("Wrote preview gallery to ./preview/*.svg");
