import { F1RaceStars } from "@/components/f1/f1-race-stars";
import { formatUtcEventDate } from "@/lib/dates";
import type { F1RaceCardData } from "@/lib/f1/types";

export function F1RaceCard({ race }: { race: F1RaceCardData }) {
  return (
    <article className="overflow-hidden rounded-lg border border-[#BAC2CB] bg-white shadow-card">
      <header className="flex items-start justify-between gap-3 border-b border-slate-200/80 bg-slate-50 px-6 py-4">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold tracking-tight text-slate-900">
            {race.name}
          </h2>
          <p className="mt-1 truncate text-xs text-slate-500">{race.circuitName}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <StatusBadge status={race.status} />
          <time
            dateTime={race.startsAt}
            className="text-xs font-semibold tabular-nums text-slate-600"
          >
            {formatUtcEventDate(race.startsAt)}
          </time>
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

        <div className="mt-4 flex flex-col gap-3 rounded-sm border border-amber-200/80 bg-amber-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            {race.winnerDriverImage ? (
              <img
                src={race.winnerDriverImage}
                alt=""
                className="h-10 w-10 shrink-0 object-contain"
              />
            ) : (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-amber-100 font-mono text-xs text-amber-800">
                P1
              </span>
            )}
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                Winner
              </p>
              <p className="truncate text-sm font-bold text-slate-900">
                {race.winnerDriver ?? "To be confirmed"}
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

function StatusBadge({ status }: { status: string }) {
  if (!status || /scheduled|upcoming|not started/i.test(status)) {
    return null;
  }

  return (
    <span className="rounded-sm border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
      {status}
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
