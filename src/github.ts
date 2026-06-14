import { DayInfo } from "./types";

const QUERY = `
query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            contributionCount
          }
        }
      }
    }
  }
}`;

interface Day {
  date: string;
  contributionCount: number;
}

/** Fetch the user's contribution calendar via the GitHub GraphQL API. */
export async function fetchContributions(username: string, token: string): Promise<DayInfo> {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "commitchi",
    },
    body: JSON.stringify({ query: QUERY, variables: { login: username } }),
  });

  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  }

  const json: any = await res.json();
  if (json.errors) {
    throw new Error(`GraphQL error: ${JSON.stringify(json.errors)}`);
  }

  const calendar = json.data.user.contributionsCollection.contributionCalendar;
  const days: Day[] = calendar.weeks
    .flatMap((w: { contributionDays: Day[] }) => w.contributionDays)
    .sort((a: Day, b: Day) => a.date.localeCompare(b.date));

  const today = days[days.length - 1];

  let daysSinceLastContribution = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].contributionCount > 0) break;
    daysSinceLastContribution++;
  }
  // If even the latest day had a contribution, the loop above counts 0 — correct.

  return {
    todayDate: today.date,
    todayCount: today.contributionCount,
    daysSinceLastContribution,
    totalThisYear: calendar.totalContributions,
  };
}
