export const RATING_MIN = 0.5;
export const RATING_MAX = 5;
export const RATING_STEP = 0.5;
export const STAR_COUNT = 5;

export const STAR_FILL = "#9a3412";
export const STAR_EMPTY = "#cbd2d9";

export function isValidRating(value: number): boolean {
  if (value < RATING_MIN || value > RATING_MAX) {
    return false;
  }

  return Math.round(value * 2) === value * 2;
}

export function toRatingNumber(value: number | string | null | undefined): number | null {
  if (value == null) {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatRating(value: number): string {
  return value.toFixed(1);
}

export function formatRatingCount(count: number): string {
  return count === 1 ? "1 rating" : `${count} ratings`;
}
