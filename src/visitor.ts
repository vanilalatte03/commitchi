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
      ? [`포만감 +${bonus.fullness}`, `행복도 +${bonus.happiness}`]
      : [`행복도 +${bonus.happiness}`, `포만감 +${bonus.fullness}`];
  if (bonus.stamina) parts.push(`체력 +${bonus.stamina}`);
  const stats = parts.join(", ");
  const intro =
    action === "feed"
      ? `🍖 @${actor}님이 ${petName}에게 밥을 줬어요.`
      : `🎮 @${actor}님이 ${petName}와 같이 놀아줬어요.`;

  return `${intro}\n\n${stats}. 내일 또 돌봐줄 수 있어요.`;
}

function rateLimitedComment(actor: string, petName: string): string {
  return `@${actor}님, ${petName}는 오늘 이미 돌봄을 받았어요.\n\n내일 다시 도와주세요.`;
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
