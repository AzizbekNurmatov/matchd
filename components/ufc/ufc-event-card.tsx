import Link from "next/link";
import { UfcFightStars } from "@/components/ufc/ufc-fight-stars";
import { formatMatchCardDate } from "@/lib/dates";
import { formatFightResult } from "@/lib/ufc/format";
import type { UfcEventCardData, UfcFightCard } from "@/lib/ufc/queries";

export function UfcEventCard({
  event,
  showDetailsLink = true,
}: {
  event: UfcEventCardData;
  showDetailsLink?: boolean;
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
          {formatMatchCardDate(event.startsAt)}
        </time>
      </header>

      <ol>
        {event.fights.map((fight) => (
          <BoutRow key={fight.id} eventId={event.id} fight={fight} />
        ))}
      </ol>

      {showDetailsLink ? (
        <footer className="pt-3">
          <Link
            href={`/ufc/${event.id}`}
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

  return (
    <li className="border-b border-slate-100 py-3 last:border-b-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#475569]">
        {fight.weightClass ?? "Catchweight"}
      </p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Fighter
              name={fight.fighterAName}
              imageUrl={fight.fighterAImageUrl}
              emphasis={fighterEmphasis(fight.winnerName, fight.fighterAName)}
            />
            <span className="text-xs text-[#475569]">vs</span>
            <Fighter
              name={fight.fighterBName}
              imageUrl={fight.fighterBImageUrl}
              emphasis={fighterEmphasis(fight.winnerName, fight.fighterBName)}
            />
          </div>
          {result ? (
            <p className="mt-1 text-[11px] font-semibold tracking-wide text-[#991B1B]">
              {result}
            </p>
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

function fighterEmphasis(
  winnerName: string | null,
  fighterName: string,
): "winner" | "loser" | "even" {
  if (!winnerName) {
    return "even";
  }
  return winnerName === fighterName ? "winner" : "loser";
}

function Fighter({
  name,
  imageUrl,
  emphasis,
}: {
  name: string;
  imageUrl: string | null;
  emphasis: "winner" | "loser" | "even";
}) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="h-8 w-8 shrink-0 rounded-full bg-[#E2E8F0] object-cover"
        />
      ) : (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E2E8F0] text-[11px] font-semibold text-[#475569]">
          {name.slice(0, 1)}
        </span>
      )}
      <span
        className={
          emphasis === "winner"
            ? "truncate text-sm font-semibold text-[#0B132B]"
            : emphasis === "loser"
              ? "truncate text-sm text-[#94A3B8]"
              : "truncate text-sm text-[#0B132B]"
        }
      >
        {name}
      </span>
    </span>
  );
}
