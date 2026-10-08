import "server-only";

import type { CatalogMatch } from "@/lib/sports-data/catalog";
import {
  searchSoccerCatalog,
  type LeagueSearchHit,
  type TeamSearchHit,
} from "@/lib/sports-data/queries";
import { searchF1Races } from "@/lib/f1/queries";
import type { F1RaceCardData } from "@/lib/f1/types";
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
  races: F1RaceCardData[];
};

const EMPTY_RESULTS: SearchResults = {
  fighters: [],
  events: [],
  promotions: [],
  teams: [],
  leagues: [],
  matches: [],
  races: [],
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

const EMPTY_F1: F1RaceCardData[] = [];

export async function searchCatalog(rawQuery: string): Promise<SearchResults> {
  const query = rawQuery.trim().toLowerCase();
  if (!query) {
    return EMPTY_RESULTS;
  }

  const [ufc, soccer, races] = await Promise.all([
    searchUfcCatalog(query).catch((error: unknown) => {
      console.error("UFC search failed:", error);
      return EMPTY_UFC;
    }),
    searchSoccerCatalog(query).catch((error: unknown) => {
      console.error("Soccer search failed:", error);
      return EMPTY_SOCCER;
    }),
    searchF1Races(query).catch((error: unknown) => {
      console.error("F1 search failed:", error);
      return EMPTY_F1;
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
    races,
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
    {
      id: "f1",
      name: "Formula 1",
      detail: "Grand Prix racing",
      href: "/f1",
      keywords: "f1 formula 1 formula one grand prix",
    },
  ];
}
