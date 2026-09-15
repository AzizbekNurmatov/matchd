import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Matches",
};

export default async function MatchesPage() {
  const supabase = await createClient();

  const { data: matches, error } = await supabase
    .from("matches")
    .select(`
      id,
      kickoff_at,
      status,
      home_score,
      away_score,
      competition:competitions (name),
      home_team:teams!matches_home_team_id_fkey (name, short_name, crest_url),
      away_team:teams!matches_away_team_id_fkey (name, short_name, crest_url)
    `)
    .order("kickoff_at", { ascending: false });

  if (error) {
    console.error("Error fetching matches:", error);
  }

  return (
    <Container className="py-12">
      <div className="flex flex-col gap-1 border-b border-border pb-6">
        <h1 className="font-serif text-3xl tracking-tight text-[#f4f4f0]">Matches</h1>
        <p className="text-sm text-[#8e8e8e]">
          Recent fixtures, community ratings, and fan reviews.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {(!matches || matches.length === 0) ? (
          <p className="text-sm text-[#8e8e8e]">No matches found.</p>
        ) : (
          matches.map((match: any) => {
            const date = new Date(match.kickoff_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });

            return (
              <Link
                key={match.id}
                href={`/matches/${match.id}`}
                className="group relative flex flex-col justify-between rounded-lg border border-border bg-[#161616] p-5 transition-colors hover:border-[#383838] hover:bg-[#1c1c1c]"
              >
                <div className="flex items-center justify-between text-xs text-[#8e8e8e]">
                  <span>{match.competition?.name}</span>
                  <span>{date}</span>
                </div>

                <div className="my-5 flex items-center justify-between">
                  {/* Home Team */}
                  <div className="flex flex-1 items-center gap-3">
                    {match.home_team?.crest_url && (
                      <img
                        src={match.home_team.crest_url}
                        alt={match.home_team.name}
                        className="h-8 w-8 object-contain"
                      />
                    )}
                    <span className="font-medium text-[#f4f4f0] text-sm">
                      {match.home_team?.name}
                    </span>
                  </div>

                  {/* Score */}
                  <div className="flex items-center px-4 font-mono text-base font-semibold text-[#f4f4f0]">
                    {match.home_score ?? "-"} : {match.away_score ?? "-"}
                  </div>

                  {/* Away Team */}
                  <div className="flex flex-1 items-center justify-end gap-3 text-right">
                    <span className="font-medium text-[#f4f4f0] text-sm">
                      {match.away_team?.name}
                    </span>
                    {match.away_team?.crest_url && (
                      <img
                        src={match.away_team.crest_url}
                        alt={match.away_team.name}
                        className="h-8 w-8 object-contain"
                      />
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-[#8e8e8e] pt-3 border-t border-[#222]">
                  <span className="capitalize">{match.status}</span>
                  <span className="text-amber-400 font-medium group-hover:underline">
                    View match →
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </Container>
  );
}