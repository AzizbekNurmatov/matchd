import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { UfcEventCard } from "@/components/ufc/ufc-event-card";
import { listUfcEvents } from "@/lib/ufc/queries";

export const metadata: Metadata = {
  title: "Fights",
};

export default async function FightsPage() {
  const events = await listUfcEvents();

  return (
    <div className="bg-[#D8DCE2]">
      <Container className="py-12 sm:py-14">
        <header className="border-b border-[#CBD2D9] pb-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#475569]">
            UFC // Main cards
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-[#0B132B] sm:text-5xl">
            FIGHTS
          </h1>
          <p className="mt-2 text-sm text-[#475569]">
            Synced UFC cards, newest first.
          </p>
        </header>

        {events.length === 0 ? (
          <p className="mt-8 text-sm text-[#475569]">No UFC cards yet.</p>
        ) : (
          <ol className="mt-8 flex flex-col gap-4">
            {events.map((event) => (
              <li key={event.id}>
                <UfcEventCard event={event} />
              </li>
            ))}
          </ol>
        )}
      </Container>
    </div>
  );
}
