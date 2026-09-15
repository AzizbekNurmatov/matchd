import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Container } from "@/components/layout/container";
import { StarDisplay } from "@/components/ratings/star-display";
import { StarPicker } from "@/components/ratings/star-picker";
import { ReviewForm } from "@/components/reviews/review-form";
import { ReviewList } from "@/components/reviews/review-list";
import type { ReviewItem } from "@/components/reviews/types";
import { createClient } from "@/lib/supabase/server";
import {
  formatRating,
  formatRatingCount,
  toRatingNumber,
} from "@/lib/ratings";
import type { MatchStatus } from "@/types/database";

type TeamSummary = {
  name: string;
  short_name: string | null;
  crest_url: string | null;
};

type MatchDetail = {
  id: string;
  kickoff_at: string;
  status: MatchStatus;
  home_score: number | null;
  away_score: number | null;
  competition: { name: string } | null;
  home_team: TeamSummary | null;
  away_team: TeamSummary | null;
};

const loadMatchPage = cache(async (id: string) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const matchQuery = supabase
    .from("matches")
    .select(
      `
      id,
      kickoff_at,
      status,
      home_score,
      away_score,
      competition:competitions (name),
      home_team:teams!matches_home_team_id_fkey (name, short_name, crest_url),
      away_team:teams!matches_away_team_id_fkey (name, short_name, crest_url)
    `,
    )
    .eq("id", id)
    .maybeSingle();

  const statsQuery = supabase
    .from("match_rating_stats")
    .select("average_rating, rating_count")
    .eq("match_id", id)
    .maybeSingle();

  const reviewsQuery = supabase
    .from("reviews")
    .select(
      `
      id,
      user_id,
      body,
      created_at,
      updated_at,
      profile:profiles!reviews_user_id_fkey (username)
    `,
    )
    .eq("match_id", id)
    .order("created_at", { ascending: false });

  const ratingsQuery = supabase
    .from("match_ratings")
    .select("user_id, rating")
    .eq("match_id", id);

  const [matchResult, statsResult, reviewsResult, ratingsResult] =
    await Promise.all([matchQuery, statsQuery, reviewsQuery, ratingsQuery]);

  if (matchResult.error || !matchResult.data) {
    return null;
  }

  const row = matchResult.data;

  const match: MatchDetail = {
    id: row.id,
    kickoff_at: row.kickoff_at,
    status: row.status,
    home_score: row.home_score,
    away_score: row.away_score,
    competition: asSingle(row.competition),
    home_team: asSingle(row.home_team),
    away_team: asSingle(row.away_team),
  };

  const ratingByUser = new Map(
    (ratingsResult.data ?? []).map((rating) => [
      rating.user_id,
      toRatingNumber(rating.rating),
    ]),
  );

  const reviews: ReviewItem[] = (reviewsResult.data ?? []).map((review) => {
    const profile = asSingle(review.profile);

    return {
      id: review.id,
      userId: review.user_id,
      username: profile?.username ?? "user",
      body: review.body,
      createdAt: review.created_at,
      updatedAt: review.updated_at,
      rating: ratingByUser.get(review.user_id) ?? null,
    };
  });

  return {
    match,
    averageRating: toRatingNumber(statsResult.data?.average_rating),
    ratingCount: statsResult.data?.rating_count ?? 0,
    userRating: user ? (ratingByUser.get(user.id) ?? null) : null,
    userReview: user
      ? (reviews.find((review) => review.userId === user.id) ?? null)
      : null,
    reviews,
    currentUserId: user?.id ?? null,
    isLoggedIn: Boolean(user),
  };
});

function asSingle<T>(value: T | T[] | null): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await loadMatchPage(id);

  if (!data) {
    return { title: "Match not found" };
  }

  const home = data.match.home_team?.name ?? "Home";
  const away = data.match.away_team?.name ?? "Away";

  return { title: `${home} vs ${away}` };
}

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await loadMatchPage(id);

  if (!data) {
    notFound();
  }

  const {
    match,
    averageRating,
    ratingCount,
    userRating,
    userReview,
    reviews,
    currentUserId,
    isLoggedIn,
  } = data;
  const home = match.home_team;
  const away = match.away_team;
  const hasScore = match.home_score != null && match.away_score != null;

  return (
    <Container className="py-12">
      <section className="rounded-lg bg-[#161616] px-4 py-10 sm:px-8">
        <p className="text-center text-sm text-muted">
          {match.competition?.name ?? "Match"}
        </p>
        <p className="mt-1 text-center text-sm text-muted">
          {formatKickoff(match.kickoff_at)} · {statusLabel(match.status)}
        </p>

        <h1 className="sr-only">
          {home?.name ?? "Home"} vs {away?.name ?? "Away"}
        </h1>

        <div className="mt-10 grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
          <TeamBlock team={home} />
          <div className="px-2 text-center sm:px-4">
            <p className="font-serif text-4xl tracking-tight text-[#f4f4f0] sm:text-5xl">
              {hasScore ? (
                <>
                  {match.home_score}
                  <span className="mx-2 text-muted">–</span>
                  {match.away_score}
                </>
              ) : (
                <span className="text-muted">vs</span>
              )}
            </p>
          </div>
          <TeamBlock team={away} />
        </div>
      </section>

      <section className="mt-14 grid gap-10 border-t border-border pt-10 sm:grid-cols-2">
        <div>
          <h2 className="text-xs uppercase tracking-[0.18em] text-muted">
            Community
          </h2>
          {averageRating != null && ratingCount > 0 ? (
            <div className="mt-4 flex items-end gap-4">
              <p className="font-serif text-6xl leading-none tracking-tight text-[#e4b42a]">
                {formatRating(averageRating)}
              </p>
              <div className="pb-1">
                <StarDisplay value={averageRating} size={18} />
                <p className="mt-2 text-sm text-muted">
                  {formatRatingCount(ratingCount)}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <StarDisplay value={0} size={18} />
              <p className="mt-3 text-sm text-muted">No ratings yet</p>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xs uppercase tracking-[0.18em] text-muted">
            Your rating
          </h2>
          <div className="mt-4">
            {isLoggedIn ? (
              <StarPicker matchId={match.id} value={userRating} />
            ) : (
              <p className="text-sm text-muted">
                <Link
                  href="/login"
                  className="text-foreground underline decoration-border hover:decoration-accent"
                >
                  Log in
                </Link>{" "}
                to rate this match.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-14 border-t border-border pt-10">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-xs uppercase tracking-[0.18em] text-muted">
            Reviews
          </h2>
          {reviews.length > 0 ? (
            <p className="text-xs text-[#8e8e8e]">
              {reviews.length === 1 ? "1 review" : `${reviews.length} reviews`}
            </p>
          ) : null}
        </div>

        <div className="mt-8">
          {isLoggedIn ? (
            <ReviewForm
              matchId={match.id}
              existingBody={userReview?.body ?? null}
            />
          ) : (
            <p className="text-sm text-[#8e8e8e]">
              <Link
                href="/login"
                className="text-[#f4f4f0] underline decoration-border hover:decoration-[#e4b42a]"
              >
                Log in
              </Link>{" "}
              to write a review.
            </p>
          )}
        </div>

        <div className="mt-10">
          <ReviewList
            reviews={reviews}
            matchId={match.id}
            currentUserId={currentUserId}
          />
        </div>
      </section>
    </Container>
  );
}

function TeamBlock({ team }: { team: TeamSummary | null }) {
  const name = team?.name ?? "TBD";

  return (
    <div className="flex flex-col items-center text-center">
      {team?.crest_url ? (
        <img
          src={team.crest_url}
          alt=""
          className="h-16 w-16 object-contain sm:h-20 sm:w-20"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#161616] font-serif text-xl text-muted sm:h-20 sm:w-20">
          {name.slice(0, 1)}
        </div>
      )}
      <p className="mt-4 font-serif text-lg leading-tight tracking-tight text-[#f4f4f0] sm:text-2xl">
        {name}
      </p>
      {team?.short_name && team.short_name !== team.name ? (
        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted">
          {team.short_name}
        </p>
      ) : null}
    </div>
  );
}

function formatKickoff(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

function statusLabel(status: MatchStatus) {
  switch (status) {
    case "finished":
      return "Full time";
    case "live":
      return "Live";
    case "scheduled":
      return "Kickoff";
    case "postponed":
      return "Postponed";
    case "cancelled":
      return "Cancelled";
  }
}
