import type { ReactNode } from "react";
import Link from "next/link";
import { UfcFightStars } from "@/components/ufc/ufc-fight-stars";
import { formatUtcEventDate } from "@/lib/dates";
import { formatFightResult } from "@/lib/ufc/format";
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
  const winner =
    fight.winnerName === fight.fighterAName
      ? fight.fighterAName
      : fight.winnerName === fight.fighterBName
        ? fight.fighterBName
        : null;
  const opponent =
    winner === fight.fighterAName
      ? fight.fighterBName
      : winner === fight.fighterBName
        ? fight.fighterAName
        : null;

  return (
    <li className="border-b border-slate-100 py-2.5 last:border-b-0">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {fight.weightClass ?? "Catchweight"}
      </p>
      <div className="mt-1 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm">
            {winner && opponent ? (
              <>
                <span className="font-semibold text-slate-900">{winner}</span>
                <span className="mx-1.5 text-xs font-medium text-slate-500">
                  def.
                </span>
                <span className="font-medium text-slate-700">{opponent}</span>
              </>
            ) : (
              <>
                <span className="font-medium text-slate-700">
                  {fight.fighterAName}
                </span>
                <span className="mx-1.5 text-xs font-medium text-slate-500">
                  vs
                </span>
                <span className="font-medium text-slate-700">
                  {fight.fighterBName}
                </span>
              </>
            )}
          </p>
          {result ? (
            <p className="mt-1 text-xs font-medium text-amber-700">{result}</p>
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
