const BASE_URL = "https://v3.football.api-sports.io";

export type ApiSportsFixture = {
  fixture: {
    id: number;
    date: string;
    status?: { short?: string | null; long?: string | null } | null;
  };
  league: {
    id: number;
    name?: string | null;
    country?: string | null;
    logo?: string | null;
    season?: number | null;
  };
  teams: {
    home: { id: number; name: string; logo?: string | null };
    away: { id: number; name: string; logo?: string | null };
  };
  goals?: { home?: number | null; away?: number | null } | null;
  score?: {
    fulltime?: { home?: number | null; away?: number | null } | null;
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

export async function fetchLeagueFixtures(
  leagueId: number,
  season: number,
): Promise<ApiSportsFixture[]> {
  const rows: ApiSportsFixture[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && page <= 20) {
    const url = new URL(`${BASE_URL}/fixtures`);
    url.searchParams.set("league", String(leagueId));
    url.searchParams.set("season", String(season));
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
        `API-Sports football request failed (${response.status} ${response.statusText}): ${body}`,
      );
    }

    const payload = (await response.json()) as Envelope<ApiSportsFixture>;
    const errors = payload.errors;
    const hasErrors = Array.isArray(errors)
      ? errors.length > 0
      : errors != null &&
        typeof errors === "object" &&
        Object.keys(errors).length > 0;
    if (hasErrors) {
      throw new Error(`API-Sports football returned errors: ${JSON.stringify(errors)}`);
    }

    rows.push(...(payload.response ?? []));
    totalPages = payload.paging?.total ?? 1;
    page += 1;
  }

  return rows;
}
