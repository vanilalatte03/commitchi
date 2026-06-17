"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = require("node:fs");
const github_1 = require("./github");
const state_1 = require("./state");
const render_1 = require("./render");
const render_dex_1 = require("./render-dex");
const config_1 = require("./config");
async function main() {
    const now = new Date();
    const config = (0, config_1.loadConfig)();
    const username = process.env.GH_USERNAME;
    const token = process.env.GH_TOKEN;
    let activity;
    if (username && token) {
        activity = await (0, github_1.fetchActivity)(username, token);
        console.log(`Fetched ${username}: today=${activity.todayDate} count=${activity.todayCount} streak=${activity.streak} langs=${activity.languageCount} collab=${activity.collabRatio.toFixed(2)} weekend=${activity.weekendRatio.toFixed(2)}`);
    }
    else {
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
    const save = (0, state_1.loadState)(now, config);
    const ticked = (0, state_1.applyTick)((0, state_1.getActivePet)(save), activity, now, config);
    const next = (0, state_1.setActivePet)(save, ticked);
    (0, state_1.saveState)(next);
    (0, node_fs_1.writeFileSync)("pet.svg", (0, render_1.renderSVG)(ticked, config, next.dex));
    (0, node_fs_1.writeFileSync)("dex.svg", (0, render_dex_1.renderDexSVG)(next.dex, config));
    const celebration = ticked.celebration ? ` · celebrating ${ticked.celebration.title}` : "";
    console.log(`Pet: ${ticked.stage}/${ticked.species} · ${ticked.mood} · fullness ${ticked.fullness}% · happiness ${ticked.happiness}% · stamina ${ticked.stamina}% · age ${ticked.ageDays}d${celebration}. Wrote pet.svg + dex.svg + pet-state.json.`);
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
