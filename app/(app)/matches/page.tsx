import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import {
  SUPPORTED_LEAGUES,
  isSupportedLeagueCode,
  type SupportedLeagueCode,
} from "@/lib/sports-data/constants";
import { createClient } from "@/lib/supabase/server";
import { formatRating, toRatingNumber } from "@/lib/ratings";
import { cn } from "@/lib/utils";
import type { MatchStatus } from "@/types/database";

export const metadata: Metadata = {
  title: "Matches",
};

const PAGE_SIZE = 18;

const MATCH_SELECT = `
  id,
  kickoff_at,
  status,
  home_score,
  away_score,
  competition:competitions!inner (id, name, short_name),
  home_team:teams!matches_home_team_id_fkey (name, short_name, crest_url),
  away_team:teams!matches_away_team_id_fkey (name, short_name, crest_url)
`;

const TABS = [
  { id: "recent", label: "Recent Results" },
  { id: "upcoming", label: "Upcoming" },
  { id: "all", label: "All Fixtures" },
] as const;

const LEAGUES = [
  { id: "all" as const, label: "All Leagues" },
  ...SUPPORTED_LEAGUES.map((league) => ({
    id: league.code,
    label: league.name,
  })),
];

type CatalogTab = (typeof TABS)[number]["id"];
type CatalogLeague = "all" | SupportedLeagueCode;

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
  competition: { id: string; name: string; short_name: string | null } | null;
  home_team: TeamSummary | null;
  away_team: TeamSummary | null;
  averageRating: number | null;
};

export default async function MatchesPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; page?: string; league?: string }>;
}) {
  const params = await searchParams;
  const tab = parseTab(params?.tab || "recent");
  const league = parseLeague(params?.league || "all");
  const page = parsePage(params?.page || "1");
  const from = (page - 1) * PAGE_SIZE;
  const to = page * PAGE_SIZE - 1;

  const supabase = await createClient();
  const { data, error, count } = await fetchCatalogPage(
    supabase,
    tab,
    league,
    from,
    to,
  );

  if (error) {
    console.error("Error fetching matches:", error);
  }

  const ratingByMatch = await loadRatings(
    supabase,
    (data ?? []).map((row) => row.id),
  );

  const matches: CatalogMatch[] = (data ?? []).map((row) => ({
    id: row.id,
    kickoff_at: row.kickoff_at,
    status: row.status,
    home_score: row.home_score,
    away_score: row.away_score,
    competition: asSingle(row.competition),
    home_team: asSingle(row.home_team),
    away_team: asSingle(row.away_team),
    averageRating: ratingByMatch.get(row.id) ?? null,
  }));

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  if (tab === "all" && matches.length > 0) {
    console.info("[matches:all] page slice", {
      page,
      league,
      firstKickoff: matches[0].kickoff_at,
      lastKickoff: matches[matches.length - 1].kickoff_at,
    });
  }

  return (
    <div className="bg-[#0f0f10]">
      <Container className="py-12 sm:py-14">
        <header className="border-b border-[#242426] pb-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#8c887b]">
            Fixtures & Results // Archive
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-[#f3efe6] sm:text-5xl">
            MATCHES
          </h1>
          <p className="mt-2 text-sm text-[#8c887b]">
            Recent fixtures, community ratings, and fan reviews.
          </p>
        </header>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <nav
            className="flex gap-6 border-b border-[#242426]"
            aria-label="Match filters"
          >
            {TABS.map((item) => {
              const active = item.id === tab;
              return (
                <Link
                  key={item.id}
                  href={matchesHref(item.id, league)}
                  scroll={false}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "pb-2 font-mono text-xs uppercase tracking-wider",
                    active
                      ? "border-b-2 border-[#d4973b] text-[#f3efe6]"
                      : "text-[#8c887b] hover:text-[#f3efe6]",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <LeagueDropdown tab={tab} league={league} />
        </div>

        {matches.length === 0 ? (
          <div className="mt-8 border border-[#242426] bg-[#151516] px-5 py-12">
            <p className="font-mono text-xs uppercase tracking-widest text-[#8c887b]">
              {emptyCopy(tab, league)}
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {matches.map((match) => (
              <MatchTicket key={match.id} match={match} />
            ))}
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
    </div>
  );
}

function MatchTicket({ match }: { match: CatalogMatch }) {
  const finished = match.status === "finished";
  const homeScore = finished ? (match.home_score ?? "-") : "-";
  const awayScore = finished ? (match.away_score ?? "-") : "-";

  return (
    <Link
      href={`/matches/${match.id}`}
      className="group flex flex-col justify-between rounded-none border border-[#242426] bg-[#151516] p-4 transition-all hover:border-[#3d3b38]"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-[#8c887b]">
          {match.competition?.name ?? "Match"}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-[#8c887b]">
          {formatCardDate(match.kickoff_at)}
        </span>
      </div>

      <div className="flex flex-col gap-3 py-4">
        <TeamScoreRow team={match.home_team} score={homeScore} />
        <TeamScoreRow team={match.away_team} score={awayScore} />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-[#242426] pt-3">
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-[#8c887b]">
          <span>{footerStatus(match)}</span>
          {finished && match.averageRating != null ? (
            <span className="text-[#d4973b]">
              ★ {formatRating(match.averageRating)}
            </span>
          ) : null}
        </div>
        <span className="font-mono text-xs uppercase tracking-wider text-[#d4973b] transition-colors group-hover:text-[#f3efe6]">
          {finished ? "Rate & Log →" : "Preview →"}
        </span>
      </div>
    </Link>
  );
}

function TeamScoreRow({
  team,
  score,
}: {
  team: TeamSummary | null;
  score: number | string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        {team?.crest_url ? (
          <img
            src={team.crest_url}
            alt=""
            className="h-5 w-5 shrink-0 object-contain"
          />
        ) : (
          <span className="flex h-5 w-5 shrink-0 items-center justify-center bg-[#0f0f10] font-mono text-[9px] text-[#8c887b]">
            {(team?.name ?? "?").slice(0, 1)}
          </span>
        )}
        <span className="truncate text-sm font-medium text-[#f3efe6]">
          {team?.name ?? "TBD"}
        </span>
      </div>
      <span className="shrink-0 font-mono text-xl font-bold text-[#f3efe6]">
        {score}
      </span>
    </div>
  );
}

function LeagueDropdown({
  tab,
  league,
}: {
  tab: CatalogTab;
  league: CatalogLeague;
}) {
  const current =
    LEAGUES.find((item) => item.id === league)?.label ?? "All Leagues";

  return (
    <details className="group relative shrink-0">
      <summary
        aria-label="League filter"
        className="flex cursor-pointer list-none items-center gap-2 border border-[#2e2d2b] bg-[#1a1918] px-3 py-1.5 font-mono text-xs uppercase text-[#f3efe6] [&::-webkit-details-marker]:hidden"
      >
        <span>{current}</span>
        <svg
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          className="h-3 w-3 text-[#8c887b] transition-transform group-open:rotate-180"
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
          />
        </svg>
      </summary>
      <div className="absolute right-0 z-20 mt-1 min-w-[13rem] border border-[#2e2d2b] bg-[#1a1918] py-1">
        {LEAGUES.map((item) => {
          const active = item.id === league;
          return (
            <Link
              key={item.id}
              href={matchesHref(tab, item.id)}
              scroll={false}
              aria-current={active ? "page" : undefined}
              className={cn(
                "block px-3 py-2 font-mono text-xs uppercase tracking-wider transition-colors",
                active
                  ? "bg-[#151516] text-[#f3efe6]"
                  : "text-[#8c887b] hover:bg-[#151516] hover:text-[#f3efe6]",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </details>
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
      className="mt-10 flex items-center justify-between border-t border-[#242426] pt-6 font-mono text-xs uppercase tracking-widest"
      aria-label="Pagination"
    >
      {hasPrevious ? (
        <Link href={previousHref} className="text-[#f3efe6] hover:text-[#d4973b]">
          Previous
        </Link>
      ) : (
        <span className="text-[#8c887b]">Previous</span>
      )}

      <p className="text-[#8c887b]">
        Page {page} of {totalPages}
      </p>

      {hasNext ? (
        <Link href={nextHref} className="text-[#f3efe6] hover:text-[#d4973b]">
          Next
        </Link>
      ) : (
        <span className="text-[#8c887b]">Next</span>
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
  const code = value?.toUpperCase() ?? "";
  if (isSupportedLeagueCode(code)) {
    return code;
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

function emptyCopy(tab: CatalogTab, league: CatalogLeague): string {
  const leagueLabel =
    league === "all"
      ? "this archive"
      : (SUPPORTED_LEAGUES.find((item) => item.code === league)?.name ??
        league);

  switch (tab) {
    case "upcoming":
      return `No upcoming fixtures scheduled for ${leagueLabel}.`;
    case "all":
      return `No matches found for ${leagueLabel}.`;
    default:
      return `No completed matches found for ${leagueLabel}.`;
  }
}

function formatCardDate(iso: string): string {
  return new Date(iso)
    .toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase();
}

function formatKickoffTime(iso: string): string {
  const time = new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
  return `${time} UTC`;
}

function footerStatus(match: CatalogMatch): string {
  switch (match.status) {
    case "finished":
      return "FT";
    case "live":
      return "Live";
    case "scheduled":
      return `Fixture · ${formatKickoffTime(match.kickoff_at)}`;
    case "postponed":
      return "Postponed";
    case "cancelled":
      return "Cancelled";
  }
}

async function fetchCatalogPage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tab: CatalogTab,
  league: CatalogLeague,
  from: number,
  to: number,
) {
  let query = supabase.from("matches").select(MATCH_SELECT, { count: "exact" });

  if (league !== "all") {
    query = query.eq("competition.short_name", league);
  }

  // Recent = finished, newest first. No rolling date cutoff, so older
  // results stay in the archive. Upcoming uses our DB statuses: Football-Data
  // TIMED/SCHEDULED map to `scheduled`, IN_PLAY maps to `live`.
  if (tab === "recent") {
    query = query.eq("status", "finished").order("kickoff_at", {
      ascending: false,
    });
  } else if (tab === "upcoming") {
    query = query
      .in("status", ["scheduled", "live"])
      .order("kickoff_at", { ascending: true });
  } else {
    query = query.order("kickoff_at", { ascending: true });
  }

  return query.range(from, to);
}

async function loadRatings(
  supabase: Awaited<ReturnType<typeof createClient>>,
  matchIds: string[],
) {
  const ratings = new Map<string, number>();
  if (matchIds.length === 0) {
    return ratings;
  }

  const { data, error } = await supabase
    .from("match_rating_stats")
    .select("match_id, average_rating")
    .in("match_id", matchIds);

  if (error || !data) {
    return ratings;
  }

  for (const row of data) {
    if (!row.match_id) {
      continue;
    }
    const value = toRatingNumber(row.average_rating);
    if (value != null) {
      ratings.set(row.match_id, value);
    }
  }

  return ratings;
}

function asSingle<T>(value: T | T[] | null): T | null {
  if (!value) {
    return null;
  }
  return Array.isArray(value) ? (value[0] ?? null) : value;
}
