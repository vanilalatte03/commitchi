import { appendFileSync, writeFileSync } from "node:fs";
import { loadConfig } from "./config";
import { renderSVG } from "./render";
import {
  applyVisitorInteraction,
  loadState,
  saveState,
  VISITOR_ACTION_BONUS,
} from "./state";
import { VisitorAction } from "./types";

const RESULT_PATH = "interaction-result.json";

interface InteractionResultFile {
  recognized: boolean;
  changed: boolean;
  applied: boolean;
  action: VisitorAction | null;
  actor: string;
  comment: string;
}

function parseInteractionTitle(title: string): VisitorAction | null {
  const normalized = title.trim().toLowerCase().replace(/\s+/g, " ");
  if (normalized === "commitchi: feed") return "feed";
  if (normalized === "commitchi: play") return "play";
  return null;
}

function actionLabel(action: VisitorAction): string {
  return action === "feed" ? "Feed" : "Play";
}

function appliedComment(action: VisitorAction, actor: string, petName: string): string {
  const bonus = VISITOR_ACTION_BONUS[action];
  const parts =
    action === "feed"
      ? [`fullness +${bonus.fullness}`, `happiness +${bonus.happiness}`]
      : [`happiness +${bonus.happiness}`, `fullness +${bonus.fullness}`];
  if (bonus.stamina) parts.push(`stamina +${bonus.stamina}`);
  const stats = parts.join(", ");
  const intro =
    action === "feed"
      ? `🍖 @${actor} fed ${petName}.`
      : `🎮 @${actor} played with ${petName}.`;

  return `${intro}\n\nApplied ${stats}. Come back tomorrow to help again.`;
}

function rateLimitedComment(actor: string, petName: string): string {
  return `@${actor}, ${petName} already got a visit from you today.\n\nCome back tomorrow to help again.`;
}

function writeGithubOutputs(result: InteractionResultFile): void {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) return;

  appendFileSync(
    outputPath,
    [
      `recognized=${result.recognized}`,
      `changed=${result.changed}`,
      `applied=${result.applied}`,
      `action=${result.action ?? ""}`,
      "",
    ].join("\n")
  );
}

function writeResult(result: InteractionResultFile): void {
  writeFileSync(RESULT_PATH, JSON.stringify(result, null, 2) + "\n");
  writeGithubOutputs(result);
}

function main(): void {
  const now = new Date();
  const title = process.env.ISSUE_TITLE ?? process.argv.slice(2).join(" ");
  const actor = (process.env.ISSUE_AUTHOR ?? process.env.GITHUB_ACTOR ?? "").trim();
  const action = parseInteractionTitle(title);

  if (!action) {
    const result: InteractionResultFile = {
      recognized: false,
      changed: false,
      applied: false,
      action: null,
      actor,
      comment: "This issue title is not a Commitchi visitor action, so no pet state changed.",
    };
    writeResult(result);
    console.log("Ignored issue: title is not a Commitchi visitor action.");
    return;
  }

  if (!actor) throw new Error("ISSUE_AUTHOR or GITHUB_ACTOR is required for visitor actions.");

  const config = loadConfig();
  const update = applyVisitorInteraction(loadState(now, config), action, actor, now, config);

  if (update.applied) {
    saveState(update.state);
    writeFileSync("pet.svg", renderSVG(update.state, config));
  }

  const result: InteractionResultFile = {
    recognized: true,
    changed: update.applied,
    applied: update.applied,
    action,
    actor: update.actor,
    comment: update.applied
      ? appliedComment(action, update.actor, update.state.name)
      : rateLimitedComment(update.actor, update.state.name),
  };

  writeResult(result);
  console.log(
    `${actionLabel(action)} interaction from @${update.actor}: ${update.reason}${
      update.applied ? "; wrote pet.svg + pet-state.json." : "."
    }`
  );
}

main();
