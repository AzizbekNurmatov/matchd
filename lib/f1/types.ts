export type F1Session = {
  id: string;
  type: string;
  label: string;
  startsAt: string;
  status: string;
};

export type F1RaceCardData = {
  id: string;
  season: number;
  name: string;
  circuitName: string;
  circuitImage: string | null;
  country: string | null;
  startsAt: string;
  status: string;
  winnerDriver: string | null;
  winnerTeam: string | null;
  winnerDriverImage: string | null;
  drivers: string[];
  sessions: F1Session[];
  userRating: number | null;
};
