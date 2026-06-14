import { writeFileSync } from "node:fs";
import { fetchActivity } from "./github";
import { applyTick, loadState, saveState } from "./state";
import { renderSVG } from "./render";
import { Activity } from "./types";

async function main() {
  const now = new Date();
  const username = process.env.GH_USERNAME;
  const token = process.env.GH_TOKEN;

  let activity: Activity;
  if (username && token) {
    activity = await fetchActivity(username, token);
    console.log(
      `Fetched ${username}: today=${activity.todayDate} count=${activity.todayCount} streak=${activity.streak} langs=${activity.languageCount} collab=${activity.collabRatio.toFixed(2)} weekend=${activity.weekendRatio.toFixed(2)}`
    );
  } else {
    console.warn("No GH_USERNAME/GH_TOKEN set — running in DEMO mode with sample data.");
    activity = {
      todayDate: now.toISOString().slice(0, 10),
      todayCount: 3,
      totalThisYear: 412,
      daysSinceLastContribution: 0,
      streak: 4,
      weekendRatio: 0.2,
      collabRatio: 0.25,
      languageCount: 3,
    };
  }

  const state = applyTick(loadState(now), activity, now);
  saveState(state);
  writeFileSync("pet.svg", renderSVG(state));
  console.log(
    `Pet: ${state.stage}/${state.species} · ${state.mood} · fullness ${state.fullness}% · age ${state.ageDays}d. Wrote pet.svg + pet-state.json.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
