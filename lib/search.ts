import "server-only";

import type { CatalogMatch } from "@/lib/sports-data/catalog";
import {
  searchSoccerCatalog,
  type LeagueSearchHit,
  type TeamSearchHit,
} from "@/lib/sports-data/queries";
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
  teams: TeamSearchHit[];
  leagues: LeagueSearchHit[];
  matches: CatalogMatch[];
};

const EMPTY_RESULTS: SearchResults = {
  fighters: [],
  events: [],
  promotions: [],
  teams: [],
  leagues: [],
  matches: [],
};

const EMPTY_UFC = {
  fighters: [] as FighterSearchHit[],
  events: [] as UfcEventCardData[],
};

const EMPTY_SOCCER = {
  teams: [] as TeamSearchHit[],
  leagues: [] as LeagueSearchHit[],
  matches: [] as CatalogMatch[],
};

export async function searchCatalog(rawQuery: string): Promise<SearchResults> {
  const query = rawQuery.trim().toLowerCase();
  if (!query) {
    return EMPTY_RESULTS;
  }

  const [ufc, soccer] = await Promise.all([
    searchUfcCatalog(query).catch((error: unknown) => {
      console.error("UFC search failed:", error);
      return EMPTY_UFC;
    }),
    searchSoccerCatalog(query).catch((error: unknown) => {
      console.error("Soccer search failed:", error);
      return EMPTY_SOCCER;
    }),
  ]);

  return {
    fighters: ufc.fighters,
    events: ufc.events,
    promotions: promotionCatalog()
      .filter((item) =>
        `${item.name} ${item.detail} ${item.keywords}`
          .toLowerCase()
          .includes(query),
      )
      .slice(0, 4)
      .map((item) => ({
        id: item.id,
        name: item.name,
        detail: item.detail,
        href: item.href,
        matches: [],
      })),
    teams: soccer.teams,
    leagues: soccer.leagues,
    matches: soccer.matches,
  };
}

function promotionCatalog() {
  return [
    {
      id: "ufc",
      name: "UFC",
      detail: "Mixed martial arts",
      href: "/fights",
      keywords: "ufc ultimate fighting championship mma",
    },
  ];
}
