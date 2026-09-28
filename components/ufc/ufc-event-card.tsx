import type { ReactNode } from "react";
import Link from "next/link";
import { UfcFightStars } from "@/components/ufc/ufc-fight-stars";
import { formatUtcEventDate } from "@/lib/dates";
import { formatFightResult, resolveFightWinner } from "@/lib/ufc/format";
import type { UfcEventCardData, UfcFightCard } from "@/lib/ufc/queries";

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
    <article className="rounded-lg border border-[#BAC2CB] bg-white p-4 shadow-card sm:p-5">
      <header className="mb-2 flex items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex shrink-0 items-center rounded-sm border border-[#DC2626] bg-[#FEE2E2] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#991B1B]">
            UFC
          </span>
          <h2 className="truncate text-sm font-semibold text-[#0B132B] sm:text-base">
            {event.name}
          </h2>
        </div>
        <time
          dateTime={event.startsAt}
          className="shrink-0 text-xs font-semibold tabular-nums text-slate-700"
        >
          {formatUtcEventDate(event.startsAt)}
        </time>
      </header>

      <ol>
        {event.fights.map((fight) => (
          <BoutRow key={fight.id} eventId={event.id} fight={fight} />
        ))}
      </ol>

      {discussion}
      {showDetailsLink ? (
        <footer className="pt-3">
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

function BoutRow({ eventId, fight }: { eventId: string; fight: UfcFightCard }) {
  const result = formatFightResult(fight.method, fight.details);
  const outcome = resolveFightWinner(
    fight.winnerName,
    fight.fighterAName,
    fight.fighterBName,
  );

  return (
    <li className="border-b border-slate-100 py-2.5 last:border-b-0">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {fight.weightClass ?? "Catchweight"}
      </p>
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
