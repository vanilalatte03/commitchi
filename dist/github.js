"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchActivity = fetchActivity;
const QUERY = `
query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      totalCommitContributions
      totalPullRequestContributions
      totalIssueContributions
      totalPullRequestReviewContributions
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            weekday
            contributionCount
          }
        }
      }
    }
    repositories(first: 100, ownerAffiliations: OWNER, isFork: false, orderBy: { field: PUSHED_AT, direction: DESC }) {
      nodes {
        primaryLanguage { name }
      }
    }
  }
}`;
/** Fetch the user's activity and distill the signals the pet cares about. */
async function fetchActivity(username, token) {
    const res = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "User-Agent": "commitchi",
        },
        body: JSON.stringify({ query: QUERY, variables: { login: username } }),
    });
    if (!res.ok)
        throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
    const json = await res.json();
    if (json.errors)
        throw new Error(`GraphQL error: ${JSON.stringify(json.errors)}`);
    const cc = json.data.user.contributionsCollection;
    const calendar = cc.contributionCalendar;
    const days = calendar.weeks
        .flatMap((w) => w.contributionDays)
        .sort((a, b) => a.date.localeCompare(b.date));
    const today = days[days.length - 1];
    let daysSinceLastContribution = 0;
    for (let i = days.length - 1; i >= 0; i--) {
        if (days[i].contributionCount > 0)
            break;
        daysSinceLastContribution++;
    }
    let streak = 0;
    for (let i = days.length - 1; i >= 0; i--) {
        if (days[i].contributionCount > 0)
            streak++;
        else if (i < days.length - 1)
            break; // allow today (the very last day) to be empty
    }
    const weekendContribs = days
        .filter((d) => d.weekday === 0 || d.weekday === 6)
        .reduce((sum, d) => sum + d.contributionCount, 0);
    const total = calendar.totalContributions || 1;
    const weekendRatio = weekendContribs / total;
    const collab = cc.totalPullRequestContributions +
        cc.totalIssueContributions +
        cc.totalPullRequestReviewContributions;
    const collabRatio = collab / Math.max(1, collab + cc.totalCommitContributions);
    const languages = new Set();
    for (const repo of json.data.user.repositories.nodes) {
        if (repo.primaryLanguage?.name)
            languages.add(repo.primaryLanguage.name);
    }
    return {
        todayDate: today.date,
        todayCount: today.contributionCount,
        totalThisYear: calendar.totalContributions,
        daysSinceLastContribution,
        streak,
        weekendRatio,
        collabRatio,
        languageCount: languages.size,
    };
}
