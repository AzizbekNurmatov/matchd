import Link from "next/link";
import { MatchCardHeader } from "@/components/matches/match-card-header";
import { formatRating } from "@/lib/ratings";
import type { CatalogMatch } from "@/lib/sports-data/catalog";

export function MatchTicket({ match }: { match: CatalogMatch }) {
  const finished = match.status === "finished";
  const homeScore = finished ? (match.home_score ?? "-") : "-";
  const awayScore = finished ? (match.away_score ?? "-") : "-";

  return (
    <Link
      href={`/matches/${match.id}`}
      className="group flex flex-col justify-between rounded-lg border border-slate-800 border-l-4 border-l-emerald-500 bg-slate-900 p-4 shadow-card transition-colors hover:border-slate-600 hover:border-l-emerald-500"
    >
      <MatchCardHeader
        league={match.competition?.name ?? null}
        leagueCode={match.competition?.short_name ?? null}
        kickoffAt={match.kickoff_at}
        variant="dark"
      />

      <div className="flex flex-col gap-3 py-4">
        <TeamScoreRow team={match.home_team} score={homeScore} />
        <TeamScoreRow team={match.away_team} score={awayScore} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-800 pt-3">
        <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-slate-300">
            {footerStatus(match)}
          </span>
          {finished && match.averageRating != null ? (
            <span className="text-amber-300">
              ★ {formatRating(match.averageRating)}
            </span>
          ) : null}
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-300 transition-colors group-hover:text-amber-200">
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
  team: CatalogMatch["home_team"];
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
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-slate-800 font-mono text-[9px] text-slate-400">
            {(team?.name ?? "?").slice(0, 1)}
          </span>
        )}
        <span className="truncate text-sm font-medium text-white">
          {team?.name ?? "TBD"}
        </span>
      </div>
      <span className="shrink-0 font-mono text-xl font-bold text-white">
        {score}
      </span>
    </div>
  );
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
    default:
      return match.status;
  }
}
