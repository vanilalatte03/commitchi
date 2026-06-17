"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = require("node:fs");
const config_1 = require("./config");
const i18n_1 = require("./i18n");
const render_1 = require("./render");
const render_dex_1 = require("./render-dex");
const state_1 = require("./state");
const RESULT_PATH = "interaction-result.json";
function parseInteractionTitle(title) {
    const normalized = title.trim().toLowerCase().replace(/\s+/g, " ");
    if (normalized === "commitchi: feed")
        return "feed";
    if (normalized === "commitchi: play")
        return "play";
    return null;
}
function actionLabel(action) {
    return action === "feed" ? "Feed" : "Play";
}
function appliedComment(action, actor, petName, note, s) {
    const bonus = state_1.VISITOR_ACTION_BONUS[action];
    const label = s.visitor.statLabel;
    const parts = action === "feed"
        ? [`${label.fullness} +${bonus.fullness}`, `${label.happiness} +${bonus.happiness}`]
        : [`${label.happiness} +${bonus.happiness}`, `${label.fullness} +${bonus.fullness}`];
    if (bonus.stamina)
        parts.push(`${label.stamina} +${bonus.stamina}`);
    const stats = parts.join(", ");
    const intro = s.visitor.appliedIntro(action, actor, petName);
    const reason = note ? s.reason(note) : null;
    return s.visitor.appliedComment(intro, stats, reason);
}
function rateLimitedComment(actor, petName, s) {
    return s.visitor.rateLimited(actor, petName);
}
function writeGithubOutputs(result) {
    const outputPath = process.env.GITHUB_OUTPUT;
    if (!outputPath)
        return;
    (0, node_fs_1.appendFileSync)(outputPath, [
        `recognized=${result.recognized}`,
        `changed=${result.changed}`,
        `applied=${result.applied}`,
        `action=${result.action ?? ""}`,
        "",
    ].join("\n"));
}
function writeResult(result) {
    (0, node_fs_1.writeFileSync)(RESULT_PATH, JSON.stringify(result, null, 2) + "\n");
    writeGithubOutputs(result);
}
// Config-independent: this fires on every opened issue, so it must not depend on
// commitchi.config.json parsing (and the workflow never posts it anyway).
const IGNORED_COMMENT = "This issue title is not a Commitchi visitor action, so no pet state changed.";
function main() {
    const now = new Date();
    const title = process.env.ISSUE_TITLE ?? process.argv.slice(2).join(" ");
    const actor = (process.env.ISSUE_AUTHOR ?? process.env.GITHUB_ACTOR ?? "").trim();
    const action = parseInteractionTitle(title);
    // Parse the title before touching config: visitor.yml runs on every opened
    // issue, so an unrelated issue must take the ignore path even if the config
    // is malformed.
    if (!action) {
        const result = {
            recognized: false,
            changed: false,
            applied: false,
            action: null,
            actor,
            comment: IGNORED_COMMENT,
        };
        writeResult(result);
        console.log("Ignored issue: title is not a Commitchi visitor action.");
        return;
    }
    if (!actor)
        throw new Error("ISSUE_AUTHOR or GITHUB_ACTOR is required for visitor actions.");
    const config = (0, config_1.loadConfig)();
    const s = (0, i18n_1.getStrings)(config.language);
    const save = (0, state_1.loadState)(now, config);
    const update = (0, state_1.applyVisitorInteraction)((0, state_1.getActivePet)(save), action, actor, now, config);
    if (update.applied) {
        const next = (0, state_1.setActivePet)(save, update.state);
        (0, state_1.saveState)(next);
        (0, node_fs_1.writeFileSync)("pet.svg", (0, render_1.renderSVG)(update.state, config, next.dex));
        (0, node_fs_1.writeFileSync)("dex.svg", (0, render_dex_1.renderDexSVG)(next.dex, config));
    }
    const result = {
        recognized: true,
        changed: update.applied,
        applied: update.applied,
        action,
        actor: update.actor,
        comment: update.applied
            ? appliedComment(action, update.actor, update.state.name, update.state.note, s)
            : rateLimitedComment(update.actor, update.state.name, s),
    };
    writeResult(result);
    console.log(`${actionLabel(action)} interaction from @${update.actor}: ${update.reason}${update.applied ? "; wrote pet.svg + dex.svg + pet-state.json." : "."}`);
}
main();
