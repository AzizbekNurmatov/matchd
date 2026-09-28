export function formatFightResult(
  method: string | null,
  details: string | null,
): string | null {
  if (!method && !details) {
    return null;
  }

  const normalized = (method ?? "").trim().toLowerCase();
  if (normalized.includes("draw") || normalized === "nc" || normalized.includes("no contest")) {
    return "DRAW";
  }
  if (normalized.includes("dec")) {
    return "DEC";
  }

  const label = normalized.includes("sub")
    ? "SUB"
    : normalized.includes("tko")
      ? "TKO"
      : normalized.includes("ko")
        ? "KO"
        : (method ?? details ?? "").trim().toUpperCase();

  if (details && !normalized.includes("dec")) {
    return `${label} (${details})`;
  }

  return label;
}

export function formatCompactFightResult(
  method: string | null,
  details: string | null,
): string | null {
  const full = formatFightResult(method, details);
  if (!full || full === "DEC" || full === "DRAW") {
    return full;
  }
  const round = details?.match(/R\d+/i)?.[0]?.toUpperCase();
  const label = full.split(" ")[0] ?? full;
  return round ? `${label} ${round}` : label;
}
