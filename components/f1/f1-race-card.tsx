import { F1RaceStars } from "@/components/f1/f1-race-stars";
import { formatUtcEventDate } from "@/lib/dates";
import type { F1RaceCardData } from "@/lib/f1/types";
import { cn } from "@/lib/utils";

export function F1RaceCard({ race }: { race: F1RaceCardData }) {
  const finished = isFinishedStatus(race.status);
  const hasWinner = Boolean(race.winnerDriver);

  return (
    <article className="overflow-hidden rounded-lg border border-slate-800 border-l-4 border-l-red-600 bg-slate-900 shadow-card">
      <header className="flex items-start justify-between gap-4 px-6 pt-5">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-red-500">
            Grand Prix
          </p>
          <h2 className="mt-1.5 truncate text-xl font-semibold tracking-tight text-white">
            {race.name}
          </h2>
          <p className="mt-1 truncate text-sm text-slate-400">{race.circuitName}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <StatusBadge finished={finished} />
          <time
            dateTime={race.startsAt}
            className="text-xs font-medium tabular-nums text-slate-500"
          >
            {formatUtcEventDate(race.startsAt)}
          </time>
        </div>
      </header>

      <div className="px-6 pt-5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Weekend
        </p>
        <ol className="mt-3 flex flex-wrap gap-2">
          {race.sessions.map((session) => (
            <li key={session.id}>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300">
                {session.label}
                <time dateTime={session.startsAt} className="tabular-nums text-slate-500">
                  {formatSessionTime(session.startsAt)}
                </time>
              </span>
            </li>
          ))}
        </ol>

        {finished && hasWinner ? (
          <div className="mt-5 flex items-center gap-3 rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-3 text-amber-200">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-amber-400/15 text-[11px] font-bold tracking-wider text-amber-300">
              P1
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-amber-100">
                {race.winnerDriver}
              </p>
              {race.winnerTeam ? (
                <p className="truncate text-xs text-amber-300/80">{race.winnerTeam}</p>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-md border border-slate-800 bg-slate-950/60 px-3 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {finished ? "Result" : "Upcoming Session"}
            </p>
            <p className="mt-1 text-sm font-medium text-slate-200">
              {finished ? "Result pending" : "Race Scheduled"}
            </p>
          </div>
        )}
      </div>

      <footer className="mt-5 flex items-center justify-between gap-4 border-t border-slate-800 px-6 py-3.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Rate this race
        </p>
        <F1RaceStars raceId={race.id} value={race.userRating} />
      </footer>
    </article>
  );
}

function isFinishedStatus(status: string) {
  return /complete|finished/i.test(status);
}

function StatusBadge({ finished }: { finished: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        finished ? "bg-slate-800 text-slate-300" : "bg-slate-800 text-slate-400",
      )}
    >
      {finished ? "Completed" : "Scheduled"}
    </span>
  );
}

function formatSessionTime(iso: string): string {
  if (!iso || Number.isNaN(Date.parse(iso))) {
    return "TBC";
  }
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(new Date(iso));
}
