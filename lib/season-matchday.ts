export const SEASON_WEEKS = 52;
export const MATCHDAY_CELL_PX = 11;
export const MATCHDAY_GAP_PX = 2;

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const MONTH_LABELS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"] as const;

const LABELED_MONTHS = new Set([7, 9, 11, 1, 3, 5]);

export type SeasonMonthLabel = {
  column: number;
  label: string;
};

export type SeasonMatchdayGridModel = {
  weeks: string[][];
  months: SeasonMonthLabel[];
};

export function startOfUtcMonday(date: Date): Date {
  const start = new Date(date);
  const weekday = start.getUTCDay();
  const daysSinceMonday = weekday === 0 ? 6 : weekday - 1;
  start.setUTCDate(start.getUTCDate() - daysSinceMonday);
  return start;
}

export function activeSeasonStart(now: Date): Date {
  const year =
    now.getUTCMonth() >= 7 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
  return new Date(Date.UTC(year, 7, 1));
}

export function buildSeasonGrid(now: Date): SeasonMatchdayGridModel {
  const start = startOfUtcMonday(activeSeasonStart(now));
  const weeks: string[][] = [];
  const months: SeasonMonthLabel[] = [];
  const seenMonths = new Set<string>();

  for (let week = 0; week < SEASON_WEEKS; week++) {
    const days: string[] = [];

    for (let row = 0; row < 7; row++) {
      const current = new Date(start);
      current.setUTCDate(start.getUTCDate() + week * 7 + row);
      days.push(current.toISOString().slice(0, 10));

      if (current.getUTCDate() > 7) {
        continue;
      }

      const month = current.getUTCMonth();
      const token = `${current.getUTCFullYear()}-${month}`;
      if (!LABELED_MONTHS.has(month) || seenMonths.has(token)) {
        continue;
      }

      seenMonths.add(token);
      months.push({ column: week, label: MONTH_NAMES[month] });
    }

    weeks.push(days);
  }

  return { weeks, months };
}

export function formatMatchdayLabel(isoDate: string): string {
  const year = isoDate.slice(0, 4);
  const month = Number(isoDate.slice(5, 7));
  const day = Number(isoDate.slice(8, 10));
  return `${MONTH_LABELS[month - 1]} ${day}, ${year}`;
}
