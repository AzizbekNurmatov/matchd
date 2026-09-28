const BASE_URL = "https://v1.mma.api-sports.io";

export type MmaFighter = {
  id?: number;
  name?: string | null;
  logo?: string | null;
  winner?: boolean | null;
};

export type MmaFight = {
  id: number;
  date?: string | null;
  slug?: string | null;
  is_main?: boolean | null;
  category?: string | null;
  status?: { long?: string | null; short?: string | null } | null;
  fighters?: {
    first?: MmaFighter | null;
    second?: MmaFighter | null;
  } | null;
};

export type MmaFightResult = {
  id?: number;
  fight?: { id?: number | null } | null;
  fighters?: MmaFight["fighters"];
  method?: string | null;
  won_type?: string | null;
  round?: number | null;
  time?: string | null;
  minute?: string | null;
  time_format?: string | null;
  result?: {
    method?: string | null;
    won_type?: string | null;
    round?: number | null;
    time?: string | null;
    minute?: string | null;
    time_format?: string | null;
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

async function mmaGet<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
): Promise<T[]> {
  const rows: T[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && page <= 20) {
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
        `MMA API request failed (${response.status} ${response.statusText}): ${body}`,
      );
    }

    const payload = (await response.json()) as Envelope<T>;
    const errors = payload.errors;
    const hasErrors = Array.isArray(errors)
      ? errors.length > 0
      : errors != null &&
        typeof errors === "object" &&
        Object.keys(errors).length > 0;
    if (hasErrors) {
      throw new Error(`MMA API returned errors: ${JSON.stringify(errors)}`);
    }

    rows.push(...(payload.response ?? []));
    totalPages = payload.paging?.total ?? 1;
    page += 1;
  }

  return rows;
}

export function fetchSeasonFights(season: number): Promise<MmaFight[]> {
  return mmaGet<MmaFight>("/fights", { season });
}

export function fetchFightsByDate(date: string): Promise<MmaFight[]> {
  return mmaGet<MmaFight>("/fights", { date });
}

export function fetchFightResultsByDate(date: string): Promise<MmaFightResult[]> {
  return mmaGet<MmaFightResult>("/fights/results", { date });
}
