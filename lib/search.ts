import "server-only";

import { SUPPORTED_LEAGUES } from "@/lib/sports-data/constants";
import type { CatalogMatch } from "@/lib/sports-data/catalog";
import { searchLeagueMatches } from "@/lib/sports-data/queries";
import {
  searchUfcCatalog,
  type FighterSearchHit,
} from "@/lib/ufc/queries";
import type { UfcEventCardData } from "@/lib/ufc/queries";

export type PromotionSearchHit = {
  id: string;
  name: string;
  detail: string;
  href: string;
  matches: CatalogMatch[];
};

export type SearchResults = {
  fighters: FighterSearchHit[];
  events: UfcEventCardData[];
  promotions: PromotionSearchHit[];
};

const EMPTY_RESULTS: SearchResults = {
  fighters: [],
  events: [],
  promotions: [],
};

export async function searchCatalog(rawQuery: string): Promise<SearchResults> {
  const query = rawQuery.trim().toLowerCase();
  if (!query) {
    return EMPTY_RESULTS;
  }

  const seeds = promotionCatalog().filter((item) =>
    `${item.name} ${item.detail} ${item.keywords}`.toLowerCase().includes(query),
  );

  const [ufc, promotions] = await Promise.all([
    searchUfcCatalog(query),
    Promise.all(seeds.slice(0, 4).map((item) => loadPromotion(item))),
  ]);

  return {
    fighters: ufc.fighters,
    events: ufc.events,
    promotions,
  };
}

async function loadPromotion(item: PromotionSeed): Promise<PromotionSearchHit> {
  return {
    id: item.id,
    name: item.name,
    detail: item.detail,
    href: item.href,
    matches: item.leagueCode ? await searchLeagueMatches(item.leagueCode, 3) : [],
  };
}

type PromotionSeed = {
  id: string;
  name: string;
  detail: string;
  href: string;
  keywords: string;
  leagueCode: string | null;
};

function promotionCatalog(): PromotionSeed[] {
  return [
    {
      id: "ufc",
      name: "UFC",
      detail: "Mixed martial arts",
      href: "/fights",
      keywords: "ufc ultimate fighting championship mma",
      leagueCode: null,
    },
    ...SUPPORTED_LEAGUES.map((league) => ({
      id: league.code,
      name: league.name,
      detail: league.country,
      href: `/matches?league=${league.code}`,
      keywords: `${league.code} ${league.name} ${league.country}`,
      leagueCode: league.code,
    })),
  ];
}
