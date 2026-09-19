import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import type { MatchStatus } from "@/types/database";

export const metadata: Metadata = {
  title: "Matches",
};

const PAGE_SIZE = 18;
const RECENT_WINDOW_DAYS = 30;
const MATCHDAY_LOOKBACK_DAYS = 3;

const MATCH_SELECT = `
  id,
  kickoff_at,
  status,
  home_score,
  away_score,
  competition:competitions (name),
  home_team:teams!matches_home_team_id_fkey (name, short_name, crest_url),
  away_team:teams!matches_away_team_id_fkey (name, short_name, crest_url)
`;

const TABS = [
  { id: "recent", label: "Recent Results" },
  { id: "upcoming", label: "Upcoming" },
  { id: "all", label: "All Fixtures" },
] as const;

const LEAGUES = [
  { id: "all", label: "All Leagues" },
  { id: "PD", label: "La Liga" },
  { id: "PL", label: "Premier League" },
] as const;

type CatalogTab = (typeof TABS)[number]["id"];
type CatalogLeague = (typeof LEAGUES)[number]["id"];

type TeamSummary = {
  name: string;
  short_name: string | null;
  crest_url: string | null;
};

type CatalogMatch = {
  id: string;
  kickoff_at: string;
  status: MatchStatus;
  home_score: number | null;
  away_score: number | null;
  competition: { name: string } | null;
  home_team: TeamSummary | null;
  away_team: TeamSummary | null;
};

export default async function MatchesPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; page?: string; league?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const tab = parseTab(params.tab);
  const league = parseLeague(params.league);
  const page = parsePage(params.page);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  const competitionId = await resolveCompetitionId(supabase, league);
  const { data, error, count } = await fetchCatalogPage(
    supabase,
    tab,
    from,
    to,
    competitionId,
    league,
  );

  if (error) {
    console.error("Error fetching matches:", error);
  }

  const matches: CatalogMatch[] = (data ?? []).map((row) => ({
    id: row.id,
    kickoff_at: row.kickoff_at,
    status: row.status,
    home_score: row.home_score,
    away_score: row.away_score,
    competition: asSingle(row.competition),
    home_team: asSingle(row.home_team),
    away_team: asSingle(row.away_team),
  }));

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
    <Container className="py-12">
      <div className="flex flex-col gap-1 border-b border-border pb-6">
        <h1 className="font-serif text-3xl tracking-tight text-[#f4f4f0]">
          Matches
        </h1>
        <p className="text-sm text-[#8e8e8e]">
          Recent fixtures, community ratings, and fan reviews.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav className="flex flex-wrap gap-1" aria-label="Match filters">
          {TABS.map((item) => {
            const active = item.id === tab;
            return (
              <Link
                key={item.id}
                href={matchesHref(item.id, league)}
                scroll={false}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-[#262626] text-[#f4f4f0]"
                    : "text-[#8e8e8e] hover:text-[#f4f4f0]",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <nav className="flex flex-wrap gap-1" aria-label="League filter">
          {LEAGUES.map((item) => {
            const active = item.id === league;
            return (
              <Link
                key={item.id}
                href={matchesHref(tab, item.id)}
                scroll={false}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-3 py-1 text-xs transition-colors",
                  active
                    ? "bg-[#262626] text-[#f4f4f0]"
                    : "text-[#8e8e8e] hover:text-[#f4f4f0]",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {matches.length === 0 ? (
        <p className="mt-8 text-sm text-[#8e8e8e]">{emptyCopy(tab)}</p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {matches.map((match) => {
            const date = formatCardDate(match.kickoff_at);

            return (
              <Link
                key={match.id}
                href={`/matches/${match.id}`}
                className="group relative flex flex-col justify-between rounded-lg border border-[#262626] bg-[#161616] p-5 transition-colors hover:border-[#383838] hover:bg-[#1c1c1c]"
              >
                <div className="flex items-center justify-between text-xs text-[#8e8e8e]">
                  <span>{match.competition?.name}</span>
                  <span>{date}</span>
                </div>

                <div className="my-5 flex items-center justify-between">
                  <div className="flex flex-1 items-center gap-3">
                    {match.home_team?.crest_url ? (
                      <img
                        src={match.home_team.crest_url}
                        alt=""
                        className="h-8 w-8 object-contain"
                      />
                    ) : null}
                    <span className="text-sm font-medium text-[#f4f4f0]">
                      {match.home_team?.name}
                    </span>
                  </div>

                  <div className="flex items-center px-4 font-mono text-base font-semibold text-[#f4f4f0]">
                    {match.home_score ?? "-"} : {match.away_score ?? "-"}
                  </div>

                  <div className="flex flex-1 items-center justify-end gap-3 text-right">
                    <span className="text-sm font-medium text-[#f4f4f0]">
                      {match.away_team?.name}
                    </span>
                    {match.away_team?.crest_url ? (
                      <img
                        src={match.away_team.crest_url}
                        alt=""
                        className="h-8 w-8 object-contain"
                      />
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[#222] pt-3 text-xs text-[#8e8e8e]">
                  <span>{statusLabel(match.status)}</span>
                  <span className="font-medium text-amber-400 group-hover:underline">
                    View match →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {totalPages > 1 ? (
        <Pagination
          tab={tab}
          league={league}
          page={page}
          totalPages={totalPages}
        />
      ) : null}
    </Container>
  );
}

function Pagination({
  tab,
  league,
  page,
  totalPages,
}: {
  tab: CatalogTab;
  league: CatalogLeague;
  page: number;
  totalPages: number;
}) {
  const previousHref = matchesHref(tab, league, page - 1);
  const nextHref = matchesHref(tab, league, page + 1);
  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav
      className="mt-10 flex items-center justify-between border-t border-[#262626] pt-6 text-sm"
      aria-label="Pagination"
    >
      {hasPrevious ? (
        <Link
          href={previousHref}
          className="text-[#f4f4f0] hover:text-amber-400"
        >
          Previous
        </Link>
      ) : (
        <span className="text-[#8e8e8e]">Previous</span>
      )}

      <p className="text-[#8e8e8e]">
        Page {page} of {totalPages}
      </p>

      {hasNext ? (
        <Link href={nextHref} className="text-[#f4f4f0] hover:text-amber-400">
          Next
        </Link>
      ) : (
        <span className="text-[#8e8e8e]">Next</span>
      )}
    </nav>
  );
}

function parseTab(value?: string): CatalogTab {
  if (value === "upcoming" || value === "all") {
    return value;
  }
  return "recent";
}

function parseLeague(value?: string): CatalogLeague {
  if (value === "PD" || value === "PL") {
    return value;
  }
  return "all";
}

function parsePage(value?: string): number {
  const parsed = Number.parseInt(value ?? "1", 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }
  return parsed;
}

function matchesHref(tab: CatalogTab, league: CatalogLeague, page = 1): string {
  const params = new URLSearchParams();
  params.set("tab", tab);
  if (league !== "all") {
    params.set("league", league);
  }
  if (page > 1) {
    params.set("page", String(page));
  }
  return `/matches?${params.toString()}`;
}

function emptyCopy(tab: CatalogTab): string {
  switch (tab) {
    case "upcoming":
      return "No upcoming fixtures.";
    case "all":
      return "No matches found.";
    default:
      return "No matches completed in the past 30 days.";
  }
}

function formatCardDate(iso: string, now = new Date()): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }),
  });
}

async function fetchCatalogPage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tab: CatalogTab,
  from: number,
  to: number,
  competitionId: string | null,
  league: CatalogLeague,
) {
  if (league !== "all" && !competitionId) {
    return { data: [], count: 0, error: null };
  }

  if (tab === "recent") {
    return fetchRecentPage(supabase, from, to, competitionId);
  }

  let query = supabase.from("matches").select(MATCH_SELECT, { count: "exact" });
  query = applyCompetitionFilter(query, competitionId);

  if (tab === "upcoming") {
    // Postgres enum is `live` (provider-normalized `in_play` is mapped on ingest).
    query = query
      .in("status", ["scheduled", "live"])
      .order("kickoff_at", { ascending: true });
  } else {
    query = query.order("kickoff_at", { ascending: false });
  }

  return query.range(from, to);
}

async function fetchRecentPage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  from: number,
  to: number,
  competitionId: string | null,
) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - RECENT_WINDOW_DAYS);

  const recent = await applyCompetitionFilter(
    supabase
      .from("matches")
      .select(MATCH_SELECT, { count: "exact" })
      .eq("status", "finished")
      .gte("kickoff_at", thirtyDaysAgo.toISOString())
      .order("kickoff_at", { ascending: false }),
    competitionId,
  ).range(from, to);

  if (recent.error || (recent.count ?? 0) > 0) {
    return recent;
  }

  let latestQuery = supabase
    .from("matches")
    .select("kickoff_at")
    .eq("status", "finished")
    .order("kickoff_at", { ascending: false });
  latestQuery = applyCompetitionFilter(latestQuery, competitionId);

  const { data: latest, error: latestError } = await latestQuery
    .limit(1)
    .maybeSingle();

  if (latestError || !latest?.kickoff_at) {
    return recent;
  }

  const latestKickoff = new Date(latest.kickoff_at);
  const matchweekStart = new Date(latestKickoff);
  matchweekStart.setUTCDate(
    matchweekStart.getUTCDate() - MATCHDAY_LOOKBACK_DAYS,
  );
  matchweekStart.setUTCHours(0, 0, 0, 0);

  return applyCompetitionFilter(
    supabase
      .from("matches")
      .select(MATCH_SELECT, { count: "exact" })
      .eq("status", "finished")
      .gte("kickoff_at", matchweekStart.toISOString())
      .lte("kickoff_at", latest.kickoff_at)
      .order("kickoff_at", { ascending: false }),
    competitionId,
  ).range(from, to);
}

async function resolveCompetitionId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  league: CatalogLeague,
) {
  if (league === "all") {
    return null;
  }

  const { data, error } = await supabase
    .from("competitions")
    .select("id")
    .eq("short_name", league)
    .maybeSingle();

  if (error) {
    console.error("Error resolving competition:", error);
    return null;
  }

  return data?.id ?? null;
}

function applyCompetitionFilter<T extends { eq: (column: string, value: string) => T }>(
  query: T,
  competitionId: string | null,
): T {
  if (!competitionId) {
    return query;
  }
  return query.eq("competition_id", competitionId);
}

function statusLabel(status: MatchStatus): string {
  switch (status) {
    case "finished":
      return "Full time";
    case "live":
      return "Live";
    case "scheduled":
      return "Upcoming";
    case "postponed":
      return "Postponed";
    case "cancelled":
      return "Cancelled";
  }
}

function asSingle<T>(value: T | T[] | null): T | null {
  if (!value) {
    return null;
  }
  return Array.isArray(value) ? (value[0] ?? null) : value;
}
