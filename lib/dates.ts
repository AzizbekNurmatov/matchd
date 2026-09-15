export function formatRelativeTime(iso: string, now = Date.now()): string {
  const date = new Date(iso);
  const diffSeconds = Math.round((date.getTime() - now) / 1000);
  const abs = Math.abs(diffSeconds);

  if (abs < 45) {
    return "just now";
  }

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (abs < 3600) {
    return rtf.format(Math.round(diffSeconds / 60), "minute");
  }

  if (abs < 86_400) {
    return rtf.format(Math.round(diffSeconds / 3600), "hour");
  }

  if (abs < 86_400 * 30) {
    return rtf.format(Math.round(diffSeconds / 86_400), "day");
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatMonthYear(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}
