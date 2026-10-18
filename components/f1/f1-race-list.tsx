"use client";

import { useState } from "react";
import { F1RaceCard } from "@/components/f1/f1-race-card";
import { EmptyState } from "@/components/ui/empty-state";
import type { F1RaceCardData } from "@/lib/f1/types";
import { cn } from "@/lib/utils";

type F1Tab = "upcoming" | "completed";

export function F1RaceList({
  completed,
  upcoming,
}: {
  completed: F1RaceCardData[];
  upcoming: F1RaceCardData[];
}) {
  const [tab, setTab] = useState<F1Tab>(
    upcoming.length > 0 ? "upcoming" : "completed",
  );
  const races = tab === "upcoming" ? upcoming : completed;

  return (
    <div className="mt-10">
      <div className="flex gap-6 border-b border-[#CBD2D9]" role="tablist">
        <TabButton
          active={tab === "upcoming"}
          count={upcoming.length}
          onClick={() => setTab("upcoming")}
        >
          Upcoming
        </TabButton>
        <TabButton
          active={tab === "completed"}
          count={completed.length}
          onClick={() => setTab("completed")}
        >
          Completed
        </TabButton>
      </div>

      {races.length === 0 ? (
        <EmptyState
          title={
            tab === "upcoming"
              ? "No upcoming races found."
              : "No past races found."
          }
        />
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {races.map((race) => (
            <F1RaceCard key={race.id} race={race} />
          ))}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  count,
  onClick,
  children,
}: {
  active: boolean;
  count: number;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "cursor-pointer pb-2 text-xs font-semibold uppercase tracking-wider",
        active
          ? "border-b-2 border-red-600 text-[#0F172A]"
          : "text-[#475569] hover:text-[#0F172A]",
      )}
    >
      {children}
      <span className="ml-2 font-mono text-[10px] text-[#475569]">{count}</span>
    </button>
  );
}
