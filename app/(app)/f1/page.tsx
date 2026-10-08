import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { F1RaceCard } from "@/components/f1/f1-race-card";
import { listF1Races } from "@/lib/f1/queries";

export const metadata: Metadata = {
  title: "F1",
};

export default async function F1Page() {
  const races = await listF1Races().catch((error: unknown) => {
    console.error("F1 calendar failed:", error);
    return [];
  });
  const season = races[0]?.season;

  return (
    <div>
      <Container className="py-12 sm:py-14">
        <header className="border-b border-[#CBD2D9] pb-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#475569]">
            Formula 1{season ? ` // ${season}` : ""} // Grand Prix
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-[#0B132B] sm:text-5xl">
            F1
          </h1>
          <p className="mt-2 text-sm text-[#475569]">
            Grand Prix weekends, the winner, and how the race felt.
          </p>
        </header>

        {races.length === 0 ? (
          <p className="mt-8 text-sm text-[#475569]">
            No Grand Prix weekends in the archive yet.
          </p>
        ) : (
          <div className="mt-8 flex flex-col gap-4">
            {races.map((race) => (
              <F1RaceCard key={race.id} race={race} />
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
