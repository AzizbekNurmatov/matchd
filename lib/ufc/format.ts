export function resolveFightWinner(
  winnerId: string | null,
  fighterA: string,
  fighterB: string,
): { winner: string; opponent: string } | null {
  if (!winnerId) {
    return null;
  }

  const token = winnerId.trim().toLowerCase();
  if (token === "a" || token === fighterA.trim().toLowerCase()) {
    return { winner: fighterA, opponent: fighterB };
  }
  if (token === "b" || token === fighterB.trim().toLowerCase()) {
    return { winner: fighterB, opponent: fighterA };
  }
  return null;
}

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
    const kind = method?.match(/\(([^)]+)\)/)?.[1]?.trim();
    return kind ? `DEC - ${kind}` : "DEC";
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
  if (!full || full === "DRAW" || full.startsWith("DEC")) {
    return full;
  }
  const round = details?.match(/R\d+/i)?.[0]?.toUpperCase();
  const label = full.split(" ")[0] ?? full;
  return round ? `${label} ${round}` : label;
}
