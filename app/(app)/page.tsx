import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Discover",
};

type TeamSummary = {
  name: string;
  short_name: string | null;
  crest_url: string | null;
};

type FeaturedMatch = {
  id: string;
  kickoffAt: string;
  homeScore: number | null;
  awayScore: number | null;
  competitionName: string | null;
  homeTeam: TeamSummary | null;
  awayTeam: TeamSummary | null;
};

export default async function HomePage() {
  const [matches, isLoggedIn] = await Promise.all([
    getFeaturedMatches(),
    getIsLoggedIn(),
  ]);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(180,83,9,0.08),rgba(216,220,226,0))]" />

      <div className="relative mx-auto w-full max-w-4xl px-5 py-16 sm:py-20">
        <section>
          <p className="font-mono text-xs uppercase tracking-widest text-[#475569]">
            TRACK · RATE · LOG
          </p>
          <h1 className="mt-5 max-w-2xl font-serif text-4xl leading-[1.15] tracking-tight text-[#0B132B] sm:text-5xl">
            The matches you watched,{" "}
            <span className="italic font-normal text-[#B45309]">remembered</span>{" "}
            together.
          </h1>
          <p className="mt-5 max-w-xl text-base text-[#475569]">
            Rate fixtures, keep a matchday diary, and see what other fans made
            of the same ninety minutes.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/matches"
              className="rounded-md bg-[#0F172A] px-5 py-2.5 text-sm font-medium text-[#F8FAFC] transition-colors hover:bg-[#1E293B]"
            >
              Browse Matches
            </Link>
            {isLoggedIn ? null : (
              <Link
                href="/signup"
                className="rounded-md border border-[#0F172A] px-5 py-2.5 text-sm font-medium text-[#0F172A] transition-colors hover:bg-[#0F172A] hover:text-[#F8FAFC]"
              >
                Create an account
              </Link>
            )}
          </div>
        </section>

        {matches.length > 0 ? (
          <section className="mt-16">
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <h2 className="text-xs uppercase tracking-[0.18em] text-[#475569]">
                Featured matches
              </h2>
              <Link
                href="/matches"
                className="text-xs text-[#B45309] hover:underline"
              >
                All matches →
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {matches.map((match) => (
                <FeaturedMatchCard key={match.id} match={match} />
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-16 grid gap-px border border-[#BAC2CB] bg-[#E2E8F0] shadow-card sm:grid-cols-3">
          <Pillar
            title="Log & Rate"
            body="Rate any fixture with 0.5 to 5.0 star precision."
          />
          <Pillar
            title="Write Reviews"
            body="Record your reactions, tactical thoughts, and matchday diary."
          />
          <Pillar
            title="Community Consensus"
            body="Explore average ratings and fan distribution histograms."
          />
        </section>
      </div>
    </div>
  );
}

function Pillar({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-white px-5 py-6">
      <h3 className="font-serif text-lg tracking-tight text-[#0B132B]">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-[#475569]">{body}</p>
    </div>
  );
}

function FeaturedMatchCard({ match }: { match: FeaturedMatch }) {
  const date = new Date(match.kickoffAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const hasScore = match.homeScore != null && match.awayScore != null;

  return (
    <Link
      href={`/matches/${match.id}`}
      className="group flex min-w-[220px] flex-1 flex-col rounded-lg border border-[#BAC2CB] bg-white p-4 shadow-card transition-colors hover:border-[#94A3B8]"
    >
      <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-wider text-[#475569]">
        <span className="truncate">{match.competitionName ?? "Match"}</span>
        <span className="shrink-0">{date}</span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center py-8">
        <div className="flex items-center gap-4">
          <Crest team={match.homeTeam} />
          <p className="font-serif text-2xl tracking-tight text-[#0B132B]">
            {hasScore ? (
              <>
                {match.homeScore}
                <span className="mx-1.5 text-[#475569]">–</span>
                {match.awayScore}
              </>
            ) : (
              <span className="text-[#475569]">vs</span>
            )}
          </p>
          <Crest team={match.awayTeam} />
        </div>
        <p className="mt-3 text-center text-xs text-[#475569]">
          {teamLabel(match.homeTeam)} vs {teamLabel(match.awayTeam)}
        </p>
      </div>

      <p className="text-xs text-[#B45309] group-hover:underline">
        Log rating →
      </p>
    </Link>
  );
}

function Crest({ team }: { team: TeamSummary | null }) {
  if (team?.crest_url) {
    return (
      <img
        src={team.crest_url}
        alt=""
        className="h-12 w-12 object-contain"
      />
    );
  }

  return (
    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#BAC2CB] bg-[#D8DCE2] font-serif text-sm text-[#475569]">
      {teamLabel(team).slice(0, 1)}
    </span>
  );
}

function teamLabel(team: TeamSummary | null) {
  return team?.short_name || team?.name || "TBD";
}

async function getIsLoggedIn() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return Boolean(user);
}

async function getFeaturedMatches(): Promise<FeaturedMatch[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .select(
      `
      id,
      kickoff_at,
      home_score,
      away_score,
      competition:competitions (name),
      home_team:teams!matches_home_team_id_fkey (name, short_name, crest_url),
      away_team:teams!matches_away_team_id_fkey (name, short_name, crest_url)
    `,
    )
    .order("kickoff_at", { ascending: false })
    .limit(4);

  if (error || !data) {
    return [];
  }

  return data.flatMap((row) => {
    const homeTeam = asSingle(row.home_team);
    const awayTeam = asSingle(row.away_team);

    return [
      {
        id: row.id,
        kickoffAt: row.kickoff_at,
        homeScore: row.home_score,
        awayScore: row.away_score,
        competitionName: asSingle(row.competition)?.name ?? null,
        homeTeam,
        awayTeam,
      },
    ];
  });
}

function asSingle<T>(value: T | T[] | null): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}
