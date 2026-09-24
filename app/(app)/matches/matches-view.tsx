"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useMemo,
  useRef,
  useState,
  useTransition,
  type MouseEvent,
} from "react";
import { formatRating } from "@/lib/ratings";
import type { CatalogMatch } from "@/lib/sports-data/catalog";
import { SUPPORTED_LEAGUES } from "@/lib/sports-data/constants";
import { cn } from "@/lib/utils";

export type Match = CatalogMatch;

const TABS = [
  { id: "recent", label: "Recent Results" },
  { id: "upcoming", label: "Upcoming" },
  { id: "all", label: "All Fixtures" },
] as const;

type CatalogTab = (typeof TABS)[number]["id"];

type MatchesViewProps = {
  initialLeague: string;
  initialTab?: CatalogTab;
  recentMatches: Match[];
  upcomingMatches: Match[];
  supportedLeagues: typeof SUPPORTED_LEAGUES;
};

export function MatchesView({
  initialLeague,
  initialTab = "recent",
  recentMatches,
  upcomingMatches,
  supportedLeagues,
}: MatchesViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<CatalogTab>(initialTab);

  const leagues = useMemo(
    () => [
      { id: "all", label: "All Leagues" },
      ...supportedLeagues.map((league) => ({
        id: league.code,
        label: league.name,
      })),
    ],
    [supportedLeagues],
  );

  const matches = useMemo(() => {
    if (activeTab === "recent") {
      return recentMatches;
    }
    if (activeTab === "upcoming") {
      return upcomingMatches;
    }
    return [...recentMatches, ...upcomingMatches].sort(
      (a, b) =>
        new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime(),
    );
  }, [activeTab, recentMatches, upcomingMatches]);

  function selectTab(nextTab: CatalogTab) {
    setActiveTab(nextTab);
    window.history.replaceState(null, "", matchesHref(nextTab, initialLeague));
  }

  function onLeagueClick(
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
    leagueId: string,
  ) {
    event.preventDefault();
    if (leagueId === initialLeague) {
      return;
    }
    startTransition(() => {
      router.push(href, { scroll: false });
    });
  }

  return (
    <>
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <nav
          className="flex gap-6 border-b border-[#CBD2D9]"
          aria-label="Match filters"
        >
          {TABS.map((item) => {
            const active = item.id === activeTab;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectTab(item.id)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "cursor-pointer pb-2 font-mono text-xs uppercase tracking-wider",
                  active
                    ? "border-b-2 border-[#9A3412] text-[#0F172A]"
                    : "text-[#475569] hover:text-[#0F172A]",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <LeagueDropdown
          tab={activeTab}
          league={initialLeague}
          leagues={leagues}
          onLeagueClick={onLeagueClick}
          onOpen={() => {
            for (const item of leagues) {
              router.prefetch(matchesHref(activeTab, item.id));
            }
          }}
        />
      </div>

      {matches.length === 0 ? (
        <div
          className={cn(
            "mt-8 border border-[#CBD2D9] bg-[#F4F6F8] px-5 py-12 transition-opacity",
            isPending && "opacity-70",
          )}
        >
          <p className="font-mono text-xs uppercase tracking-widest text-[#475569]">
            {emptyCopy(activeTab, initialLeague, supportedLeagues)}
          </p>
        </div>
      ) : (
        <div
          className={cn(
            "mt-8 grid gap-3 transition-opacity sm:grid-cols-2",
            isPending && "opacity-70",
          )}
        >
          {matches.map((match) => (
            <MatchTicket key={match.id} match={match} />
          ))}
        </div>
      )}
    </>
  );
}

function LeagueDropdown({
  tab,
  league,
  leagues,
  onLeagueClick,
  onOpen,
}: {
  tab: CatalogTab;
  league: string;
  leagues: { id: string; label: string }[];
  onLeagueClick: (
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
    leagueId: string,
  ) => void;
  onOpen: () => void;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const current =
    leagues.find((item) => item.id === league)?.label ?? "All Leagues";

  return (
    <details
      ref={detailsRef}
      className="group relative shrink-0"
      onToggle={(event) => {
        if (event.currentTarget.open) {
          onOpen();
        }
      }}
    >
      <summary
        aria-label="League filter"
        className="flex cursor-pointer list-none items-center gap-2 border border-[#CBD2D9] bg-[#E8ECEE] px-3 py-1.5 font-mono text-xs uppercase text-[#0F172A] [&::-webkit-details-marker]:hidden"
      >
        <span>{current}</span>
        <svg
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          className="h-3 w-3 text-[#475569] transition-transform group-open:rotate-180"
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
          />
        </svg>
      </summary>
      <div className="absolute right-0 z-20 mt-1 min-w-[13rem] border border-[#CBD2D9] bg-[#E8ECEE] py-1">
        {leagues.map((item) => {
          const active = item.id === league;
          const href = matchesHref(tab, item.id);
          return (
            <Link
              key={item.id}
              href={href}
              prefetch={true}
              scroll={false}
              aria-current={active ? "page" : undefined}
              onClick={(event) => {
                detailsRef.current?.removeAttribute("open");
                onLeagueClick(event, href, item.id);
              }}
              className={cn(
                "block px-3 py-2 font-mono text-xs uppercase tracking-wider transition-colors",
                active
                  ? "bg-[#F4F6F8] text-[#0F172A]"
                  : "text-[#475569] hover:bg-[#F4F6F8] hover:text-[#0F172A]",
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

function MatchTicket({ match }: { match: Match }) {
  const finished = match.status === "finished";
  const homeScore = finished ? (match.home_score ?? "-") : "-";
  const awayScore = finished ? (match.away_score ?? "-") : "-";

  return (
    <Link
      href={`/matches/${match.id}`}
      className="group flex flex-col justify-between rounded-none border border-[#CBD2D9] bg-[#F4F6F8] p-4 transition-all hover:border-[#94A3B8]"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-[#475569]">
          {match.competition?.name ?? "Match"}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-[#475569]">
          {formatCardDate(match.kickoff_at)}
        </span>
      </div>

      <div className="flex flex-col gap-3 py-4">
        <TeamScoreRow team={match.home_team} score={homeScore} />
        <TeamScoreRow team={match.away_team} score={awayScore} />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-[#CBD2D9] pt-3">
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-[#475569]">
          <span>{footerStatus(match)}</span>
          {finished && match.averageRating != null ? (
            <span className="text-[#9A3412]">
              ★ {formatRating(match.averageRating)}
            </span>
          ) : null}
        </div>
        <span className="font-mono text-xs uppercase tracking-wider text-[#9A3412] transition-colors group-hover:text-[#0F172A]">
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
  team: Match["home_team"];
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
          <span className="flex h-5 w-5 shrink-0 items-center justify-center bg-[#E4E7EB] font-mono text-[9px] text-[#475569]">
            {(team?.name ?? "?").slice(0, 1)}
          </span>
        )}
        <span className="truncate text-sm font-medium text-[#0F172A]">
          {team?.name ?? "TBD"}
        </span>
      </div>
      <span className="shrink-0 font-mono text-xl font-bold text-[#0F172A]">
        {score}
      </span>
    </div>
  );
}

function matchesHref(tab: CatalogTab, league: string): string {
  const params = new URLSearchParams();
  params.set("tab", tab);
  if (league !== "all") {
    params.set("league", league);
  }
  return `/matches?${params.toString()}`;
}

function emptyCopy(
  tab: CatalogTab,
  league: string,
  supportedLeagues: typeof SUPPORTED_LEAGUES,
): string {
  const leagueLabel =
    league === "all"
      ? "this archive"
      : (supportedLeagues.find((item) => item.code === league)?.name ?? league);

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

function footerStatus(match: Match): string {
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
    default:
      return match.status;
  }
}
