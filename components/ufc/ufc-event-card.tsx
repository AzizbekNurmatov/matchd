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
    <article className="overflow-hidden rounded-lg border border-[#BAC2CB] bg-white shadow-card">
      <header className="flex items-center justify-between gap-3 rounded-t-lg border-b border-slate-200/80 bg-slate-50 px-6 py-4">
        <h2 className="min-w-0 truncate text-lg font-bold tracking-tight text-slate-900">
          {event.name}
        </h2>
        <div className="flex shrink-0 items-center gap-2.5">
          {event.venue ? (
            <span className="hidden text-xs text-slate-500 sm:inline">
              {event.venue}
            </span>
          ) : null}
          <StatusBadge status={event.status} />
          <time
            dateTime={event.startsAt}
            className="text-xs font-semibold tabular-nums text-slate-600"
          >
            {formatUtcEventDate(event.startsAt)}
          </time>
        </div>
      </header>

      <ol className="divide-y divide-slate-100 px-6 py-2">
        {event.fights.map((fight) => (
          <BoutRow key={fight.id} eventId={event.id} fight={fight} />
        ))}
      </ol>

      {discussion ? <div className="px-6 pb-5">{discussion}</div> : null}
      {showDetailsLink ? (
        <footer className="px-6 pb-5">
          <Link
            href={`/fights?event=${event.id}`}
            className="text-xs text-[#B45309] hover:underline"
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
    <span className="rounded-sm border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
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
      className={cn(
        "py-3.5",
        isMainEvent && "-mx-6 bg-amber-50/20 px-6",
      )}
    >
      <div className="mb-1 flex items-center gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {fight.weightClass ?? "Catchweight"}
        </p>
        {isMainEvent ? (
          <span className="rounded-sm border border-amber-200/80 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
            Main event
          </span>
        ) : null}
      </div>
      <div className="mt-1 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm">
            {outcome ? (
              <>
                <span className="mr-1.5 rounded-sm border border-emerald-200/80 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  W
                </span>
                <span className="font-bold text-slate-900">{outcome.winner}</span>
                <span className="px-2 text-xs font-normal text-slate-300">vs</span>
                <span className="font-normal text-slate-400">
                  {outcome.opponent}
                </span>
              </>
            ) : (
              <>
                <span className="font-medium text-slate-700">
                  {fight.fighterAName}
                </span>
                <span className="px-2 text-xs font-normal text-slate-300">vs</span>
                <span className="font-medium text-slate-700">
                  {fight.fighterBName}
                </span>
              </>
            )}
          </p>
          {result ? (
            <p className="mt-1 text-xs font-semibold text-amber-700">{result}</p>
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
