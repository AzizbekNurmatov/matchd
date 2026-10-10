import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { F1RaceList } from "@/components/f1/f1-race-list";
import { listF1Races } from "@/lib/f1/queries";

export const metadata: Metadata = {
  title: "F1",
};

export default async function F1Page() {
  const listing = await listF1Races().catch((error: unknown) => {
    console.error("F1 calendar failed:", error);
    return null;
  });
  const season = listing?.season ?? new Date().getFullYear();
  const total = (listing?.completed.length ?? 0) + (listing?.upcoming.length ?? 0);

  return (
    <div>
      <Container className="py-12 sm:py-14">
        <header className="border-b border-[#CBD2D9] pb-6">
          <div className="h-1 w-14 bg-red-600" />
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-red-600">
            Formula 1 · {season}
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-[#0B132B] sm:text-5xl">
            F1
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#475569]">
            The {season} Grand Prix calendar, from races already run to the ones
            still ahead.
          </p>
        </header>

        {!listing ? (
          <p className="mt-8 text-sm text-[#475569]">
            The Formula 1 calendar could not be loaded.
          </p>
        ) : total === 0 ? (
          <p className="mt-8 text-sm text-[#475569]">
            No Grand Prix weekends in the {season} calendar yet.
          </p>
        ) : (
          <F1RaceList
            completed={listing.completed}
            upcoming={listing.upcoming}
          />
        )}
      </Container>
    </div>
  );
}
