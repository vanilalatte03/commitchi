import { mkdirSync, writeFileSync } from "node:fs";
import { loadConfig } from "./config";
import { renderSVG } from "./render";
import { Mood, PetState, Stage } from "./types";

const config = loadConfig();

/** Generate the default mascot asset sheet into ./preview for eyeballing. */
const base: PetState = {
  name: config.name,
  species: "yuki",
  lockedSpecies: "",
  stage: "adult",
  bornAt: "",
  lastTickAt: "",
  fullness: 80,
  happiness: 72,
  stamina: 76,
  mood: "happy",
  ageDays: 18,
  lastDayDate: "",
  lastDayCounted: 0,
};

mkdirSync("preview", { recursive: true });

const make = (file: string, over: Partial<PetState>) =>
  writeFileSync(`preview/${file}.svg`, renderSVG({ ...base, ...over }, config));

const moods: Mood[] = ["happy", "hungry", "sick"];
const stages: { stage: Stage; ageDays: number; fullness: number }[] = [
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
  species: "ghost",
  stage: "adult",
  ageDays: 20,
  mood: "sick",
  fullness: 0,
  happiness: 20,
  stamina: 8,
});

console.log("Wrote preview gallery to ./preview/*.svg");
