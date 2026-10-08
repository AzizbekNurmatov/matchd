import { F1RaceStars } from "@/components/f1/f1-race-stars";
import { formatUtcEventDate } from "@/lib/dates";
import type { F1RaceCardData } from "@/lib/f1/types";
import { cn } from "@/lib/utils";

export function F1RaceCard({ race }: { race: F1RaceCardData }) {
  const finished = /complete|finished/i.test(race.status);

  return (
    <article className="overflow-hidden rounded-lg border border-[#BAC2CB] border-t-2 border-t-red-600 bg-white shadow-card">
      <header className="border-b border-slate-200/80 bg-slate-50 px-6 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-red-600">
              Grand Prix
            </p>
            <h2 className="mt-1 truncate text-lg font-bold tracking-tight text-slate-900">
              {race.name}
            </h2>
            <p className="mt-1 truncate text-xs text-slate-500">{race.circuitName}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <StatusBadge status={race.status} finished={finished} />
            <time
              dateTime={race.startsAt}
              className="text-xs font-semibold tabular-nums text-slate-600"
            >
              {formatUtcEventDate(race.startsAt)}
            </time>
          </div>
        </div>
      </header>

      <div className="px-6 py-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Weekend
        </p>
        <ol className="mt-2 divide-y divide-slate-100">
          {race.sessions.map((session) => (
            <li
              key={session.id}
              className="flex items-center justify-between gap-3 py-1.5 text-xs"
            >
              <span className="font-medium text-slate-700">{session.label}</span>
              <time
                dateTime={session.startsAt}
                className="shrink-0 font-semibold tabular-nums text-slate-500"
              >
                {formatSessionTime(session.startsAt)}
              </time>
            </li>
          ))}
        </ol>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 p-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-slate-900 text-xs font-bold tracking-wider text-white">
              P1
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">
                {race.winnerDriver ?? "Winner TBA"}
              </p>
              {race.winnerTeam ? (
                <p className="truncate text-xs text-slate-600">{race.winnerTeam}</p>
              ) : null}
            </div>
          </div>
          <F1RaceStars raceId={race.id} value={race.userRating} />
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ status, finished }: { status: string; finished: boolean }) {
  return (
    <span
      className={cn(
        "rounded-sm border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        finished
          ? "border-red-200 bg-red-50 text-red-600"
          : "border-slate-200 bg-white text-slate-600",
      )}
    >
      {status || "Scheduled"}
    </span>
  );
}

function formatSessionTime(iso: string): string {
  const label = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(new Date(iso));
  return `${label} UTC`;
}
