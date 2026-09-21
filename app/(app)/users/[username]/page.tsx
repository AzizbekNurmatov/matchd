import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Container } from "@/components/layout/container";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileRatings } from "@/components/profile/profile-ratings";
import { ProfileReviews } from "@/components/profile/profile-reviews";
import type {
  ProfileMatchSummary,
  ProfileRatingItem,
  ProfileReviewItem,
  ProfileTeam,
} from "@/components/profile/types";
import { createClient } from "@/lib/supabase/server";
import { formatRating, toRatingNumber } from "@/lib/ratings";
import { cn } from "@/lib/utils";

const MATCH_SELECT = `
  id,
  kickoff_at,
  home_score,
  away_score,
  competition:competitions (name),
  home_team:teams!matches_home_team_id_fkey (name, short_name, crest_url),
  away_team:teams!matches_away_team_id_fkey (name, short_name, crest_url)
`;

const loadProfilePage = cache(async (username: string) => {
  const supabase = await createClient();
  const key = username.toLowerCase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      `
      id,
      username,
      created_at,
      country_code,
      favorite_team_id,
      favorite_team:teams!profiles_favorite_team_id_fkey (id, name, short_name, crest_url)
    `,
    )
    .eq("username", key)
    .maybeSingle();

  if (profileError || !profile) {
    return null;
  }

  const ratingsQuery = supabase
    .from("match_ratings")
    .select(
      `
      id,
      rating,
      created_at,
      match:matches!match_ratings_match_id_fkey (
        ${MATCH_SELECT}
      )
    `,
    )
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  const reviewsQuery = supabase
    .from("reviews")
    .select(
      `
      id,
      body,
      created_at,
      updated_at,
      match:matches!reviews_match_id_fkey (
        ${MATCH_SELECT}
      )
    `,
    )
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  const [ratingsResult, reviewsResult] = await Promise.all([
    ratingsQuery,
    reviewsQuery,
  ]);

  const ratings: ProfileRatingItem[] = [];
  const ratingByMatchId = new Map<string, number>();

  for (const row of ratingsResult.data ?? []) {
    const match = parseMatch(row.match);
    const rating = toRatingNumber(row.rating);
    if (!match || rating == null) {
      continue;
    }

    ratingByMatchId.set(match.id, rating);
    ratings.push({
      id: row.id,
      rating,
      createdAt: row.created_at,
      match,
    });
  }

  const reviews: ProfileReviewItem[] = [];

  for (const row of reviewsResult.data ?? []) {
    const match = parseMatch(row.match);
    if (!match) {
      continue;
    }

    reviews.push({
      id: row.id,
      body: row.body,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      rating: ratingByMatchId.get(match.id) ?? null,
      match,
    });
  }

  const ratingSum = ratings.reduce((sum, item) => sum + item.rating, 0);
  const averageRating =
    ratings.length > 0
      ? Number(formatRating(ratingSum / ratings.length))
      : null;

  return {
    profile: {
      username: profile.username,
      createdAt: profile.created_at,
      countryCode: profile.country_code,
      favoriteTeam: asSingle(profile.favorite_team),
      matchesRated: ratings.length,
      reviewsWritten: reviews.length,
      averageRating,
    },
    ratings,
    reviews,
    isOwn: user?.id === profile.id,
  };
});

function asSingle<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function parseMatch(value: unknown): ProfileMatchSummary | null {
  const match = asSingle(
    value as {
      id: string;
      kickoff_at: string;
      home_score: number | null;
      away_score: number | null;
      competition: { name: string } | { name: string }[] | null;
      home_team: ProfileTeam | ProfileTeam[] | null;
      away_team: ProfileTeam | ProfileTeam[] | null;
    } | null,
  );

  if (!match?.id) {
    return null;
  }

  return {
    id: match.id,
    kickoffAt: match.kickoff_at,
    homeScore: match.home_score,
    awayScore: match.away_score,
    competitionName: asSingle(match.competition)?.name ?? null,
    homeTeam: asSingle(match.home_team),
    awayTeam: asSingle(match.away_team),
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const data = await loadProfilePage(username);

  if (!data) {
    return { title: "Profile not found" };
  }

  return { title: data.profile.username };
}

export default async function UserProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { username } = await params;
  const { tab: tabParam } = await searchParams;
  const data = await loadProfilePage(username);

  if (!data) {
    notFound();
  }

  const tab = tabParam === "reviews" ? "reviews" : "ratings";
  const profilePath = `/users/${data.profile.username}`;

  return (
    <Container className="py-12">
      <ProfileHeader profile={data.profile} isOwn={data.isOwn} />

      <nav className="mt-10 flex gap-6 border-b border-border">
        <TabLink
          href={profilePath}
          active={tab === "ratings"}
          count={data.ratings.length}
        >
          Ratings
        </TabLink>
        <TabLink
          href={`${profilePath}?tab=reviews`}
          active={tab === "reviews"}
          count={data.reviews.length}
        >
          Reviews
        </TabLink>
      </nav>

      <div className="mt-8">
        {tab === "reviews" ? (
          <ProfileReviews
            username={data.profile.username}
            reviews={data.reviews}
          />
        ) : (
          <ProfileRatings
            username={data.profile.username}
            ratings={data.ratings}
          />
        )}
      </div>
    </Container>
  );
}

function TabLink({
  href,
  active,
  count,
  children,
}: {
  href: string;
  active: boolean;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      className={cn(
        "-mb-px border-b pb-3 text-sm",
        active
          ? "border-[#e4b42a] text-[#f4f4f0]"
          : "border-transparent text-[#8e8e8e] hover:text-[#f4f4f0]",
      )}
    >
      {children}
      <span className="ml-2 text-xs text-[#8e8e8e]">{count}</span>
    </Link>
  );
}
