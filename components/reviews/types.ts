export type ReviewAuthor = {
  username: string;
  avatarUrl: string | null;
  countryCode: string | null;
  favoriteTeam: {
    crest_url: string | null;
    short_name: string | null;
  } | null;
};

export type ReviewItem = {
  id: string;
  userId: string;
  author: ReviewAuthor;
  body: string;
  createdAt: string;
  updatedAt: string;
  rating: number | null;
};
