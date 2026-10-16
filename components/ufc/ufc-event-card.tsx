import type { ReactNode } from "react";
import Link from "next/link";
import { UfcFightStars } from "@/components/ufc/ufc-fight-stars";
import { formatUtcEventDate } from "@/lib/dates";
import { formatFightResult, resolveFightWinner } from "@/lib/ufc/format";
import type { UfcEventCardData, UfcFightCard } from "@/lib/ufc/queries";
import { cn } from "@/lib/utils";

export function UfcEventCard({
  event,
  showDetailsLink = true,
  discussion,
}: {
  event: UfcEventCardData;
  showDetailsLink?: boolean;
  discussion?: ReactNode;
}) {
  return (
    <article className="overflow-hidden rounded-lg border border-slate-800 border-l-4 border-l-amber-500 bg-slate-900 shadow-card">
      <header className="flex items-start justify-between gap-3 border-b border-slate-800 px-6 py-5">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
            Fight card
          </p>
          <h2 className="mt-1.5 truncate text-lg font-semibold tracking-tight text-white">
            {event.name}
          </h2>
          {event.venue ? (
            <p className="mt-1 truncate text-sm text-slate-400">{event.venue}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <StatusBadge status={event.status} />
          <time
            dateTime={event.startsAt}
            className="text-xs font-medium tabular-nums text-slate-400"
          >
            {formatUtcEventDate(event.startsAt)}
          </time>
        </div>
      </header>

      <ol className="divide-y divide-slate-800 px-6">
        {event.fights.map((fight) => (
          <BoutRow key={fight.id} eventId={event.id} fight={fight} />
        ))}
      </ol>

      {discussion ? (
        <div className="border-t border-slate-800 px-6 py-5">{discussion}</div>
      ) : null}
      {showDetailsLink ? (
        <footer className="border-t border-slate-800 px-6 py-3.5">
          <Link
            href={`/fights?event=${event.id}`}
            className="text-xs font-semibold uppercase tracking-wider text-amber-300 hover:text-amber-200"
          >
            View full card details & fan reviews →
          </Link>
        </footer>
      ) : null}
    </article>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (!status || status === "UPCOMING") {
    return null;
  }

  return (
    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
      {status}
    </span>
  );
}

function BoutRow({ eventId, fight }: { eventId: string; fight: UfcFightCard }) {
  const result = formatFightResult(fight.method, fight.details);
  const outcome = resolveFightWinner(
    fight.winnerName,
    fight.fighterAName,
    fight.fighterBName,
  );
  const isMainEvent = fight.orderIndex === 5;

  return (
    <li
      className={cn("py-4", isMainEvent && "-mx-6 bg-amber-500/10 px-6")}
    >
      <div className="mb-1 flex items-center gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {fight.weightClass ?? "Catchweight"}
        </p>
        {isMainEvent ? (
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
            Main event
          </span>
        ) : null}
      </div>
      <div className="mt-1 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm">
            {outcome ? (
              <>
                <span className="mr-1.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                  W
                </span>
                <span className="font-semibold text-white">{outcome.winner}</span>
                <span className="px-2 text-xs font-normal text-slate-500">vs</span>
                <span className="font-normal text-slate-400">
                  {outcome.opponent}
                </span>
              </>
            ) : (
              <>
                <span className="font-medium text-white">
                  {fight.fighterAName}
                </span>
                <span className="px-2 text-xs font-normal text-slate-500">vs</span>
                <span className="font-medium text-slate-300">
                  {fight.fighterBName}
                </span>
              </>
            )}
          </p>
          {result ? (
            <p className="mt-1 text-xs font-medium text-amber-300">{result}</p>
          ) : null}
        </div>
        <UfcFightStars
          fightId={fight.id}
          eventId={eventId}
          value={fight.userRating}
        />
      </div>
    </li>
  );
}
