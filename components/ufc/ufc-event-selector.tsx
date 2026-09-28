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
}: {
  events: UfcEventOption[];
  selectedId: string;
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
    router.push(`/fights?event=${id}`, { scroll: false });
  }

  return (
    <div className="mt-8 flex flex-wrap items-center gap-2">
      <CycleLink event={previous} label="← Previous" />
      <label className="min-w-[16rem] flex-1">
        <span className="sr-only">Choose a UFC card</span>
        <select
          value={selectedId}
          onChange={(event) => openEvent(event.target.value)}
          className="w-full rounded border border-[#CBD5E1] bg-white px-4 py-2.5 font-semibold text-slate-800"
        >
          <EventGroup label="2026 Season" events={season} />
          <EventGroup label="Archive" events={archive} />
        </select>
      </label>
      <CycleLink event={next} label="Next →" />
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
  label,
}: {
  event: UfcEventOption | null;
  label: string;
}) {
  if (!event) {
    return (
      <span className="shrink-0 px-2 py-2 text-sm font-semibold text-slate-400">
        {label}
      </span>
    );
  }

  return (
    <Link
      href={`/fights?event=${event.id}`}
      scroll={false}
      className="shrink-0 px-2 py-2 text-sm font-semibold text-slate-700 hover:text-[#B45309]"
    >
      {label}
    </Link>
  );
}
