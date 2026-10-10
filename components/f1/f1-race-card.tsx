import { F1RaceStars } from "@/components/f1/f1-race-stars";
import { formatUtcEventDate } from "@/lib/dates";
import type { F1RaceCardData } from "@/lib/f1/types";
import { cn } from "@/lib/utils";

export function F1RaceCard({ race }: { race: F1RaceCardData }) {
  const finished = isFinishedStatus(race.status);
  const hasWinner = Boolean(race.winnerDriver);

  return (
    <article className="overflow-hidden rounded-lg border border-[#BAC2CB] bg-white shadow-card">
      <header className="bg-red-600 px-6 py-5 text-white">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-red-100">
              Grand Prix
            </p>
            <h2 className="mt-1.5 truncate text-xl font-bold tracking-tight">
              {race.name}
            </h2>
            <p className="mt-1 truncate text-sm text-red-100">{race.circuitName}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <StatusBadge status={race.status} finished={finished} />
            <time
              dateTime={race.startsAt}
              className="text-xs font-semibold tabular-nums text-red-50"
            >
              {formatUtcEventDate(race.startsAt)}
            </time>
          </div>
        </div>
      </header>

      <div className="space-y-5 px-6 py-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Weekend
          </p>
          <ol className="mt-3 space-y-2">
            {race.sessions.map((session) => (
              <li
                key={session.id}
                className="flex items-baseline justify-between gap-4 text-sm"
              >
                <span className="font-medium text-slate-800">{session.label}</span>
                <time
                  dateTime={session.startsAt}
                  className="shrink-0 text-xs font-semibold tabular-nums text-slate-500"
                >
                  {formatSessionTime(session.startsAt)}
                </time>
              </li>
            ))}
          </ol>
        </div>

        {finished && hasWinner ? (
          <div className="flex items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 p-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-slate-900 text-xs font-bold tracking-wider text-white">
                P1
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">
                  {race.winnerDriver}
                </p>
                {race.winnerTeam ? (
                  <p className="truncate text-xs text-slate-600">{race.winnerTeam}</p>
                ) : null}
              </div>
            </div>
            <F1RaceStars raceId={race.id} value={race.userRating} />
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {finished ? "Result" : "Upcoming Session"}
              </p>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {finished ? "Result pending" : "Race Scheduled"}
              </p>
            </div>
            <F1RaceStars raceId={race.id} value={race.userRating} />
          </div>
        )}
      </div>
    </article>
  );
}

function isFinishedStatus(status: string) {
  return /complete|finished/i.test(status);
}

function StatusBadge({ status, finished }: { status: string; finished: boolean }) {
  return (
    <span
      className={cn(
        "rounded-sm border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        finished
          ? "border-white/30 bg-white/15 text-white"
          : "border-white bg-white text-red-600",
      )}
    >
      {finished ? status || "Completed" : "Race Scheduled"}
    </span>
  );
}

function formatSessionTime(iso: string): string {
  if (!iso || Number.isNaN(Date.parse(iso))) {
    return "TBC";
  }
  const label = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(new Date(iso));
  return `${label} UTC`;
}
