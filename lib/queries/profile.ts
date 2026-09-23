import type { ProfileRatingItem } from "@/components/profile/types";

export type MatchdayLogEntry = {
  id: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  score: string;
  rating: number;
};

export type MatchdayActivity = Record<string, MatchdayLogEntry[]>;

function teamName(
  team: { name: string; short_name: string | null } | null,
): string {
  return team?.name || team?.short_name || "TBD";
}

function fixtureScore(home: number | null, away: number | null): string {
  if (home == null || away == null) {
    return "vs";
  }

  return `${home} - ${away}`;
}

export function kickoffDateKey(iso: string): string {
  return iso.slice(0, 10);
}

export function buildMatchdayActivity(
  ratings: ProfileRatingItem[],
): MatchdayActivity {
  const ordered = ratings.slice().sort((a, b) => {
    const kickoff = a.match.kickoffAt.localeCompare(b.match.kickoffAt);
    return kickoff !== 0 ? kickoff : a.id.localeCompare(b.id);
  });

  const activity: MatchdayActivity = {};

  for (const item of ordered) {
    const key = kickoffDateKey(item.match.kickoffAt);
    const entry: MatchdayLogEntry = {
      id: item.id,
      matchId: item.match.id,
      homeTeam: teamName(item.match.homeTeam),
      awayTeam: teamName(item.match.awayTeam),
      score: fixtureScore(item.match.homeScore, item.match.awayScore),
      rating: item.rating,
    };

    const day = activity[key];
    if (day) {
      day.push(entry);
    } else {
      activity[key] = [entry];
    }
  }

  return activity;
}
