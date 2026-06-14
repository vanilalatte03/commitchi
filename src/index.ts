import { writeFileSync } from "node:fs";
import { fetchContributions } from "./github";
import { applyTick, loadState, saveState } from "./state";
import { renderSVG } from "./render";
import { DayInfo } from "./types";

async function main() {
  const now = new Date();
  const username = process.env.GH_USERNAME;
  const token = process.env.GH_TOKEN;

  let day: DayInfo;
  if (username && token) {
    day = await fetchContributions(username, token);
    console.log(
      `Fetched ${username}: today=${day.todayDate} count=${day.todayCount} sinceLast=${day.daysSinceLastContribution}`
    );
  } else {
    console.warn("No GH_USERNAME/GH_TOKEN set — running in DEMO mode with sample data.");
    day = {
      todayDate: now.toISOString().slice(0, 10),
      todayCount: 3,
      daysSinceLastContribution: 0,
      totalThisYear: 412,
    };
  }

  const state = applyTick(loadState(now), day, now);
  saveState(state);
  writeFileSync("pet.svg", renderSVG(state));
  console.log(`Pet is now '${state.mood}' (fullness ${state.fullness}%). Wrote pet.svg + pet-state.json.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
