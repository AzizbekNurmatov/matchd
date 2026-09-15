export const REVIEW_MIN_LENGTH = 1;
export const REVIEW_MAX_LENGTH = 2000;

export function normalizeReviewContent(content: string): string {
  return content.trim();
}

export function validateReviewContent(content: string): string | null {
  const trimmed = normalizeReviewContent(content);

  if (trimmed.length < REVIEW_MIN_LENGTH) {
    return "Write a few words about the match.";
  }

  if (trimmed.length > REVIEW_MAX_LENGTH) {
    return `Keep it under ${REVIEW_MAX_LENGTH} characters.`;
  }

  return null;
}
