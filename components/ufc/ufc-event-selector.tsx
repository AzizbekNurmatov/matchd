"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatUtcEventDate } from "@/lib/dates";

export type UfcEventOption = {
  id: string;
  name: string;
  startsAt: string;
};

const SEASON_YEAR = 2026;

export function UfcEventSelector({
  events,
  selectedId,
  tab = "upcoming",
}: {
  events: UfcEventOption[];
  selectedId: string;
  tab?: string;
}) {
  const router = useRouter();
  const index = Math.max(
    0,
    events.findIndex((event) => event.id === selectedId),
  );
  const previous = index < events.length - 1 ? events[index + 1] : null;
  const next = index > 0 ? events[index - 1] : null;
  const season = events.filter(
    (event) => new Date(event.startsAt).getUTCFullYear() >= SEASON_YEAR,
  );
  const archive = events.filter(
    (event) => new Date(event.startsAt).getUTCFullYear() < SEASON_YEAR,
  );

  function openEvent(id: string) {
    router.push(`/fights?tab=${tab}&event=${id}`, { scroll: false });
  }

  return (
    <div className="mt-8 flex flex-wrap items-center gap-2">
      <CycleLink event={previous} tab={tab} label="← Previous" />
      <label className="min-w-[16rem] flex-1">
        <span className="sr-only">Choose a UFC card</span>
        <select
          value={selectedId}
          onChange={(event) => openEvent(event.target.value)}
          className="w-full rounded-md border border-slate-800 bg-slate-900 px-4 py-2.5 font-semibold text-white"
        >
          <EventGroup label="2026 Season" events={season} />
          <EventGroup label="Archive" events={archive} />
        </select>
      </label>
      <CycleLink event={next} tab={tab} label="Next →" />
    </div>
  );
}

function EventGroup({
  label,
  events,
}: {
  label: string;
  events: UfcEventOption[];
}) {
  if (events.length === 0) {
    return null;
  }

  return (
    <optgroup label={label}>
      {events.map((event) => (
        <option key={event.id} value={event.id}>
          {event.name} • {formatUtcEventDate(event.startsAt)}
        </option>
      ))}
    </optgroup>
  );
}

function CycleLink({
  event,
  tab,
  label,
}: {
  event: UfcEventOption | null;
  tab: string;
  label: string;
}) {
  if (!event) {
    return (
      <span className="shrink-0 px-2 py-2 text-sm font-semibold text-slate-500">
        {label}
      </span>
    );
  }

  return (
    <Link
      href={`/fights?tab=${tab}&event=${event.id}`}
      scroll={false}
      className="shrink-0 px-2 py-2 text-sm font-semibold text-slate-300 hover:text-amber-300"
    >
      {label}
    </Link>
  );
}
