export type ProfileTeam = {
  name: string;
  short_name: string | null;
  crest_url: string | null;
};

export type ProfileMatchSummary = {
  id: string;
  kickoffAt: string;
  homeScore: number | null;
  awayScore: number | null;
  competitionName: string | null;
  homeTeam: ProfileTeam | null;
  awayTeam: ProfileTeam | null;
};

export type ProfileRatingItem = {
  id: string;
  rating: number;
  createdAt: string;
  match: ProfileMatchSummary;
};

export type ProfileReviewItem = {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  rating: number | null;
  match: ProfileMatchSummary;
};

export type ProfileHeaderData = {
  username: string;
  createdAt: string;
  matchesRated: number;
  reviewsWritten: number;
  averageRating: number | null;
};
