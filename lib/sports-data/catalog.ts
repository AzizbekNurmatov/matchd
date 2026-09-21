import type { MatchStatus } from "@/types/database";

export type CatalogTeam = {
  name: string;
  short_name: string | null;
  crest_url: string | null;
};

export type CatalogMatch = {
  id: string;
  kickoff_at: string;
  status: MatchStatus;
  home_score: number | null;
  away_score: number | null;
  competition: { id: string; name: string; short_name: string | null } | null;
  home_team: CatalogTeam | null;
  away_team: CatalogTeam | null;
  averageRating: number | null;
};

export type CatalogTab = "recent" | "upcoming" | "all";
