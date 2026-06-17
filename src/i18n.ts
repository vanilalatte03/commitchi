import { Language, Mood, Stage, StateNote, VisitorAction } from "./types";

/**
 * All user-facing text lives here, keyed by language. The rest of the codebase
 * pulls a `Strings` bundle via `getStrings(config.language)` so the rendered pet
 * card and visitor comments come out fully in one language — no mixing.
 */
export interface Strings {
  mood: Record<Mood, string>;
  stage: Record<Stage, string>;
  /** Heading shown above the mood value on the card. */
  moodHeading: string;
  /** One-line explanation for why the pet is in its current state. */
  reason: (note: StateNote) => string;
  stat: { fullness: string; happiness: string; stamina: string };
  /** Wraps a milestone title in the celebration badge (e.g. "Hooray! 7-day streak"). */
  celebrationBadge: (title: string) => string;
  subtitle: {
    egg: (species: string) => string;
    baby: (species: string) => string;
    ghost: (ghostName: string) => string;
    default: (species: string, stage: string) => string;
  };
  progress: {
    ghost: string;
    fullyGrown: string;
    daysToNext: (days: number) => string;
  };
  dexProgress: (collected: number, total: number) => string;
  /** Card footer combining the progress line with the pet's age. */
  footer: (progress: string, ageDays: number) => string;
  aria: (parts: {
    name: string;
    stage: string;
    species: string;
    mood: string;
    fullness: number;
    happiness: number;
    stamina: number;
    celebration: string | null;
    dex: string | null;
    reason: string | null;
  }) => string;
  evolutionCelebration: (stageLabel: string) => { title: string; detail: string };
  streakCelebration: (days: number) => { title: string; detail: string };
  visitorReactionTitles: Record<VisitorAction, string[]>;
  visitorCelebrationDetail: (action: VisitorAction, actor: string, bonus: number) => string;
  visitor: {
    statLabel: { fullness: string; happiness: string; stamina: string };
    appliedIntro: (action: VisitorAction, actor: string, petName: string) => string;
    appliedComment: (intro: string, stats: string, reason: string | null) => string;
    rateLimited: (actor: string, petName: string) => string;
  };
}

const ko: Strings = {
  mood: { happy: "기분 좋음", hungry: "배고픔", sick: "아파요" },
  stage: { egg: "알", baby: "아기", child: "어린이", teen: "청소년", adult: "성체" },
  moodHeading: "기분",
  reason: (note) => {
    const days = Math.max(0, Math.floor(note.days));
    switch (note.code) {
      case "ghost_neglect":
        return days < 1
          ? "유령 상태 · 커밋하면 돌아와요"
          : `${days}일 무소식 · 커밋하면 돌아와요`;
      case "sick_exhausted":
        return "체력 낮음 · 연속 커밋으로 회복해요";
      case "sick_starving":
        return "포만감 낮음 · 커밋하면 회복해요";
      case "sick_lonely":
        return "행복도 낮음 · 커밋·협업으로 회복해요";
      case "hungry":
        return days < 1
          ? "배고파요 · 커밋하면 배불러요"
          : `${days}일째 새 커밋 없음 · 커밋하면 배불러요`;
      case "happy_collab":
        return "협업 기여로 행복해요";
      case "happy_active":
        return "새 커밋을 먹고 기운났어요";
      case "content":
        return "안정적이에요 · 꾸준히 돌봐주세요";
    }
  },
  stat: { fullness: "포만감", happiness: "행복도", stamina: "체력" },
  celebrationBadge: (title) => `축하! ${title}`,
  subtitle: {
    egg: (species) => `${species} 알 · 곧 부화해요`,
    baby: (species) => `${species} 아기 · 자라는 중`,
    ghost: (ghostName) => `${ghostName} · 커밋을 기다리는 중`,
    default: (species, stage) => `${species} · ${stage}`,
  },
  progress: {
    ghost: "커밋을 하면 다시 깨어나요",
    fullyGrown: "다 자랐어요",
    daysToNext: (days) => `다음 진화까지 ${days}일`,
  },
  dexProgress: (collected, total) => `도감 ${collected}/${total}`,
  footer: (progress, ageDays) => `${progress} · ${ageDays}일째`,
  aria: ({ name, stage, species, mood, fullness, happiness, stamina, celebration, dex, reason }) =>
    `${name}, ${stage} ${species}, ${mood}, 포만감 ${fullness}%, 행복도 ${happiness}%, 체력 ${stamina}%${
      celebration ? `, 축하 ${celebration}` : ""
    }${reason ? `, ${reason}` : ""}${dex ? `, ${dex}` : ""}`,
  evolutionCelebration: (stageLabel) => ({
    title: `${stageLabel} 진화`,
    detail: `새로운 ${stageLabel} 단계가 열렸어요`,
  }),
  streakCelebration: (days) => ({
    title: `${days}일 연속`,
    detail: `${days}일 연속 기여를 달성했어요`,
  }),
  visitorReactionTitles: {
    feed: ["냠냠!", "잘 먹었어!"],
    play: ["신난다!", "행복 충전!"],
  },
  visitorCelebrationDetail: (action, actor, bonus) =>
    action === "feed"
      ? `@${actor}님이 밥을 줬어요 · 포만감 +${bonus}`
      : `@${actor}님이 같이 놀아줬어요 · 행복도 +${bonus}`,
  visitor: {
    statLabel: { fullness: "포만감", happiness: "행복도", stamina: "체력" },
    appliedIntro: (action, actor, petName) =>
      action === "feed"
        ? `🍖 @${actor}님이 ${petName}에게 밥을 줬어요.`
        : `🎮 @${actor}님이 ${petName}와 같이 놀아줬어요.`,
    appliedComment: (intro, stats, reason) =>
      `${intro}\n\n${stats}. 내일 또 돌봐줄 수 있어요.${
        reason ? `\n\n지금: ${reason}` : ""
      }`,
    rateLimited: (actor, petName) =>
      `@${actor}님, ${petName}는 오늘 이미 돌봄을 받았어요.\n\n내일 다시 도와주세요.`,
  },
};

const en: Strings = {
  mood: { happy: "Happy", hungry: "Hungry", sick: "Sick" },
  stage: { egg: "Egg", baby: "Baby", child: "Child", teen: "Teen", adult: "Adult" },
  moodHeading: "Mood",
  reason: (note) => {
    const days = Math.max(0, Math.floor(note.days));
    switch (note.code) {
      case "ghost_neglect":
        return days < 1
          ? "Ghosted · commit to return"
          : `${days}d quiet · commit to return`;
      case "sick_exhausted":
        return "Low stamina · streaks restore it";
      case "sick_starving":
        return "Low fullness · commit to feed";
      case "sick_lonely":
        return "Low happiness · commits & PRs help";
      case "hungry":
        return days < 1
          ? "Hungry · commit to feed"
          : `${days}d no new commits · commit to feed`;
      case "happy_collab":
        return "Collaboration made it happy";
      case "happy_active":
        return "New commits boosted it";
      case "content":
        return "Steady · keep checking in";
    }
  },
  stat: { fullness: "Fullness", happiness: "Happiness", stamina: "Stamina" },
  celebrationBadge: (title) => `Hooray! ${title}`,
  subtitle: {
    egg: (species) => `${species} egg · hatching soon`,
    baby: (species) => `${species} baby · growing`,
    ghost: (ghostName) => `${ghostName} · waiting for commits`,
    default: (species, stage) => `${species} · ${stage}`,
  },
  progress: {
    ghost: "Commit to wake it back up",
    fullyGrown: "Fully grown",
    daysToNext: (days) => `${days} ${days === 1 ? "day" : "days"} to next evolution`,
  },
  dexProgress: (collected, total) => `Dex ${collected}/${total}`,
  footer: (progress, ageDays) => `${progress} · day ${ageDays}`,
  aria: ({ name, stage, species, mood, fullness, happiness, stamina, celebration, dex, reason }) =>
    `${name}, ${stage} ${species}, ${mood}, fullness ${fullness}%, happiness ${happiness}%, stamina ${stamina}%${
      celebration ? `, celebration ${celebration}` : ""
    }${reason ? `, ${reason}` : ""}${dex ? `, ${dex.replace(/^Dex\b/, "dex")}` : ""}`,
  evolutionCelebration: (stageLabel) => ({
    title: `Evolved to ${stageLabel}`,
    detail: `Reached the ${stageLabel} stage`,
  }),
  streakCelebration: (days) => ({
    title: `${days}-day streak`,
    detail: `Reached a ${days}-day contribution streak`,
  }),
  visitorReactionTitles: {
    feed: ["Yum!", "Tasty!"],
    play: ["So fun!", "Yay!"],
  },
  visitorCelebrationDetail: (action, actor, bonus) =>
    action === "feed"
      ? `@${actor} fed it · fullness +${bonus}`
      : `@${actor} played · happiness +${bonus}`,
  visitor: {
    statLabel: { fullness: "fullness", happiness: "happiness", stamina: "stamina" },
    appliedIntro: (action, actor, petName) =>
      action === "feed"
        ? `🍖 @${actor} fed ${petName}.`
        : `🎮 @${actor} played with ${petName}.`,
    appliedComment: (intro, stats, reason) =>
      `${intro}\n\nApplied ${stats}. Come back tomorrow to help again.${
        reason ? `\n\nNow: ${reason}` : ""
      }`,
    rateLimited: (actor, petName) =>
      `@${actor}, ${petName} already got a visit from you today.\n\nCome back tomorrow to help again.`,
  },
};

const STRINGS: Record<Language, Strings> = { ko, en };

export function getStrings(language: Language): Strings {
  return STRINGS[language] ?? ko;
}
