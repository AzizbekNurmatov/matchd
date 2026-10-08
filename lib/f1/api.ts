import "server-only";

const BASE_URL = "https://v1.formula-1.api-sports.io";

export type F1RaceSession = {
  id: number;
  competition?: {
    id?: number;
    name?: string | null;
    location?: { country?: string | null; city?: string | null } | null;
  } | null;
  circuit?: {
    id?: number;
    name?: string | null;
    image?: string | null;
  } | null;
  season?: number | null;
  type?: string | null;
  date?: string | null;
  status?: string | null;
};

export type F1RaceRanking = {
  position?: number | null;
  driver?: {
    id?: number;
    name?: string | null;
    abbr?: string | null;
    image?: string | null;
  } | null;
  team?: {
    id?: number;
    name?: string | null;
    logo?: string | null;
  } | null;
};

type Envelope<T> = {
  response?: T[];
  errors?: unknown;
  paging?: { current?: number; total?: number };
};

function getApiKey(): string {
  const key = process.env.MMA_API_KEY;
  if (!key) {
    throw new Error(
      "Missing MMA_API_KEY. Add it to .env.local (never expose it to the browser).",
    );
  }
  return key;
}

export function isPlanError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /free plan|do not have access|plan/i.test(message);
}

export async function fetchRaces(
  params: Record<string, string | number | undefined>,
): Promise<F1RaceSession[]> {
  return f1Get<F1RaceSession>("/races", params);
}

export async function fetchRaceRankings(raceId: number): Promise<F1RaceRanking[]> {
  return f1Get<F1RaceRanking>("/rankings/races", { race: raceId });
}

async function f1Get<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
): Promise<T[]> {
  const rows: T[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && page <= 8) {
    const url = new URL(`${BASE_URL}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
    if (page > 1) {
      url.searchParams.set("page", String(page));
    }

    const response = await fetch(url, {
      headers: { "x-apisports-key": getApiKey() },
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `API-Sports Formula 1 request failed (${response.status} ${response.statusText}): ${body}`,
      );
    }

    const payload = (await response.json()) as Envelope<T>;
    if (hasErrors(payload.errors)) {
      throw new Error(
        `API-Sports Formula 1 returned errors: ${JSON.stringify(payload.errors)}`,
      );
    }

    rows.push(...(payload.response ?? []));
    totalPages = payload.paging?.total ?? 1;
    page += 1;
  }

  return rows;
}

function hasErrors(errors: unknown): boolean {
  if (errors == null) {
    return false;
  }
  if (Array.isArray(errors)) {
    return errors.length > 0;
  }
  if (typeof errors === "object") {
    return Object.keys(errors).length > 0;
  }
  return Boolean(errors);
}
