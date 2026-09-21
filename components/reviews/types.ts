export type ReviewItem = {
  id: string;
  userId: string;
  username: string;
  countryCode: string | null;
  favoriteTeam: {
    crest_url: string | null;
    short_name: string | null;
  } | null;
  body: string;
  createdAt: string;
  updatedAt: string;
  rating: number | null;
};
