import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import {
  SUPPORTED_LEAGUES,
  isSupportedLeagueCode,
  type SupportedLeagueCode,
} from "@/lib/sports-data/constants";
import { getCachedLeagueMatches } from "@/lib/sports-data/queries";
import { MatchesView } from "./matches-view";

export const metadata: Metadata = {
  title: "Matches",
};

type CatalogTab = "recent" | "upcoming" | "all";
type CatalogLeague = "all" | SupportedLeagueCode;

export default async function MatchesPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; page?: string; league?: string }>;
}) {
  const params = await searchParams;
  const tab = parseTab(params?.tab || "recent");
  const league = parseLeague(params?.league || "all");
  const { recentMatches, upcomingMatches } =
    await getCachedLeagueMatches(league);

  return (
    <div className="bg-[#E4E7EB]">
      <Container className="py-12 sm:py-14">
        <header className="border-b border-[#CBD2D9] pb-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#475569]">
            Fixtures & Results // Archive
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-[#0F172A] sm:text-5xl">
            MATCHES
          </h1>
          <p className="mt-2 text-sm text-[#475569]">
            Recent fixtures, community ratings, and fan reviews.
          </p>
        </header>

        <MatchesView
          initialLeague={league}
          initialTab={tab}
          recentMatches={recentMatches}
          upcomingMatches={upcomingMatches}
          supportedLeagues={SUPPORTED_LEAGUES}
        />
      </Container>
    </div>
  );
}

function parseTab(value?: string): CatalogTab {
  if (value === "upcoming" || value === "all") {
    return value;
  }
  return "recent";
}

function parseLeague(value?: string): CatalogLeague {
  const code = value?.toUpperCase() ?? "";
  if (isSupportedLeagueCode(code)) {
    return code;
  }
  return "all";
}
