"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { MatchdayActivity } from "@/lib/queries/profile";
import { formatRating } from "@/lib/ratings";
import {
  MATCHDAY_CELL_PX,
  MATCHDAY_GAP_PX,
  formatMatchdayLabel,
  type SeasonMatchdayGridModel,
} from "@/lib/season-matchday";
import { cn } from "@/lib/utils";

const DAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", ""] as const;

const CELL_CLASS = {
  empty:
    "bg-[#181819] border border-[#242426]/50 rounded-[2px]",
  single:
    "bg-[#d4973b]/40 border border-[#d4973b]/60 rounded-[2px]",
  multi:
    "bg-[#d4973b] border border-[#f3efe6]/40 shadow-[0_0_8px_rgba(212,151,59,0.3)] rounded-[2px]",
} as const;

type TooltipState = {
  dateKey: string;
  left: number;
  top: number;
  above: boolean;
};

function tone(count: number): keyof typeof CELL_CLASS {
  if (count >= 2) {
    return "multi";
  }

  if (count === 1) {
    return "single";
  }

  return "empty";
}

function placeTooltip(rect: DOMRect): Pick<TooltipState, "left" | "top" | "above"> {
  const above = rect.top > 120;
  const half = Math.min(120, Math.max(0, (window.innerWidth - 16) / 2));
  const center = rect.left + rect.width / 2;
  const left = Math.min(
    window.innerWidth - 8 - half,
    Math.max(8 + half, center),
  );

  return {
    left,
    top: above ? rect.top - 8 : rect.bottom + 8,
    above,
  };
}

export function SeasonMatchdayGrid({
  activity = {},
  grid,
}: {
  activity?: MatchdayActivity;
  grid: SeasonMatchdayGridModel;
}) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  useEffect(() => {
    if (!tooltip) {
      return;
    }

    const hide = () => setTooltip(null);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, [tooltip]);

  const entries = tooltip ? (activity[tooltip.dateKey] ?? []) : [];
  const dateLabel = tooltip ? formatMatchdayLabel(tooltip.dateKey) : "";

  return (
    <section className="mt-10" aria-label="Season matchday log">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8c887b]">
        SUPPORTER CAMPAIGN // MATCHDAY TIMELINE
      </p>

      <div className="mt-4 overflow-x-auto">
        <div className="flex w-max items-start gap-1.5 py-1">
          <div
            className="flex w-6 shrink-0 flex-col pt-5"
            style={{ gap: MATCHDAY_GAP_PX }}
            aria-hidden
          >
            {DAY_LABELS.map((label, index) => (
              <span
                key={index}
                className="text-[9px] font-mono leading-none text-[#8c887b]"
                style={{ height: MATCHDAY_CELL_PX, lineHeight: `${MATCHDAY_CELL_PX}px` }}
              >
                {label}
              </span>
            ))}
          </div>

          <div>
            <div
              className="relative mb-1 h-4"
              style={{
                width:
                  grid.weeks.length * MATCHDAY_CELL_PX +
                  (grid.weeks.length - 1) * MATCHDAY_GAP_PX,
              }}
            >
              {grid.months.map((month) => (
                <span
                  key={`${month.label}-${month.column}`}
                  className="absolute top-0 text-[10px] font-mono uppercase tracking-wider text-[#8c887b]"
                  style={{ left: month.column * (MATCHDAY_CELL_PX + MATCHDAY_GAP_PX) }}
                >
                  {month.label}
                </span>
              ))}
            </div>

            <div
              className="flex"
              style={{ gap: MATCHDAY_GAP_PX }}
              onMouseLeave={() => setTooltip(null)}
            >
              {grid.weeks.map((week) => (
                <div
                  key={week[0]}
                  className="flex flex-col"
                  style={{ gap: MATCHDAY_GAP_PX }}
                >
                  {week.map((dateKey) => {
                    const logged = activity[dateKey] ?? [];
                    return (
                      <div
                        key={dateKey}
                        className={cn("shrink-0", CELL_CLASS[tone(logged.length)])}
                        style={{
                          width: MATCHDAY_CELL_PX,
                          height: MATCHDAY_CELL_PX,
                        }}
                        onMouseEnter={(event) => {
                          setTooltip({
                            dateKey,
                            ...placeTooltip(event.currentTarget.getBoundingClientRect()),
                          });
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] font-mono text-[#8c887b]">
        <span>Less</span>
        <span
          className={cn("inline-block", CELL_CLASS.empty)}
          style={{ width: MATCHDAY_CELL_PX, height: MATCHDAY_CELL_PX }}
        />
        <span
          className={cn("inline-block", CELL_CLASS.single)}
          style={{ width: MATCHDAY_CELL_PX, height: MATCHDAY_CELL_PX }}
        />
        <span
          className={cn("inline-block", CELL_CLASS.multi)}
          style={{ width: MATCHDAY_CELL_PX, height: MATCHDAY_CELL_PX }}
        />
        <span>More</span>
      </div>

      {tooltip
        ? createPortal(
            <div
              className="pointer-events-none fixed z-50 w-max max-w-[240px] rounded-sm border border-[#2e2d2b] bg-[#151516] p-2 text-xs shadow-xl"
              style={{
                left: tooltip.left,
                top: tooltip.top,
                transform: tooltip.above
                  ? "translate(-50%, -100%)"
                  : "translate(-50%, 0)",
              }}
            >
              {entries.length === 0 ? (
                <p className="text-[#f3efe6]">
                  {dateLabel} • No matches logged
                </p>
              ) : (
                <>
                  <p className="font-mono uppercase tracking-wider text-[#8c887b]">
                    {dateLabel}
                  </p>
                  <ul className="mt-1.5 space-y-1.5">
                    {entries.map((entry) => (
                      <li key={entry.id}>
                        <p className="leading-snug text-[#f3efe6]">
                          {entry.homeTeam} {entry.score} {entry.awayTeam}
                        </p>
                        <p className="mt-0.5 font-mono text-[#d4973b]">
                          ★ {formatRating(entry.rating)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}
