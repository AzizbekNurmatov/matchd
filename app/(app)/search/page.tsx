import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { searchCatalog } from "@/lib/search";
import { SearchView } from "./search-view";

export const metadata: Metadata = {
  title: "Search",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results = query ? await searchCatalog(query) : null;

  return (
    <div>
      <Container className="py-12 sm:py-14">
        <header className="border-b border-[#CBD2D9] pb-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#475569]">
            Archive // Lookup
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-[#0B132B] sm:text-5xl">
            SEARCH
          </h1>
          <p className="mt-2 text-sm text-[#475569]">
            Fighters, teams, races, and matches across the archive.
          </p>
        </header>
        <SearchView initialQuery={query} initialResults={results} />
      </Container>
    </div>
  );
}
