"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatUtcEventDate } from "@/lib/dates";

export type UfcEventOption = {
  id: string;
  name: string;
  startsAt: string;
};

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
  const newer = index > 0 ? events[index - 1] : null;
  const older = index < events.length - 1 ? events[index + 1] : null;

  function openEvent(id: string) {
    router.push(`/fights?event=${id}`, { scroll: false });
  }

  return (
    <div className="mt-8 flex flex-wrap items-center gap-2">
      <CycleLink event={newer} label="← Newer" />
      <label className="min-w-0 flex-1">
        <span className="sr-only">Choose a UFC card</span>
        <select
          value={selectedId}
          onChange={(event) => openEvent(event.target.value)}
          className="w-full rounded border border-[#CBD5E1] bg-white px-3 py-2 text-sm font-semibold text-slate-800"
        >
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name} • {formatUtcEventDate(event.startsAt)}
            </option>
          ))}
        </select>
      </label>
      <CycleLink event={older} label="Older →" />
    </div>
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
      className="shrink-0 px-2 py-2 text-sm font-semibold text-slate-800 hover:text-[#B45309]"
    >
      {label}
    </Link>
  );
}
