export const RATING_MIN = 0.5;
export const RATING_MAX = 5;
export const RATING_STEP = 0.5;

export function isValidRating(value: number): boolean {
  if (value < RATING_MIN || value > RATING_MAX) {
    return false;
  }

  return Math.round(value * 2) === value * 2;
}
