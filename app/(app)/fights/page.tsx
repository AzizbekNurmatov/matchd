import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { UfcEventCard } from "@/components/ufc/ufc-event-card";
import { UfcEventDiscussion } from "@/components/ufc/ufc-event-discussion";
import { createClient } from "@/lib/supabase/server";
import { getUfcEventReviews, listUfcEvents } from "@/lib/ufc/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Fights",
};

export default async function FightsPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const { event: requestedId } = await searchParams;
  const events = await listUfcEvents();
  const selected =
    events.find((event) => event.id === requestedId) ?? events[0] ?? null;
  const reviews = selected ? await getUfcEventReviews(selected.id) : [];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
            Pick a card to see the main event, the undercard, and the discussion.
          </p>
        </header>

        {events.length === 0 || !selected ? (
          <p className="mt-8 text-sm text-[#475569]">No UFC cards yet.</p>
        ) : (
          <>
            <div
              className="mt-8 flex gap-2 overflow-x-auto pb-1"
              aria-label="UFC cards"
            >
              {events.map((event) => {
                const active = event.id === selected.id;
                return (
                  <Link
                    key={event.id}
                    href={`/fights?event=${event.id}`}
                    scroll={false}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "shrink-0 rounded-sm border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider",
                      active
                        ? "border-[#DC2626] bg-[#FEE2E2] text-[#991B1B]"
                        : "border-[#BAC2CB] bg-white text-[#475569] hover:text-[#0B132B]",
                    )}
                  >
                    {eventPillLabel(event.name)}
                  </Link>
                );
              })}
            </div>
            <div className="mt-6">
              <UfcEventCard
                event={selected}
                showDetailsLink={false}
                discussion={
                  <UfcEventDiscussion
                    eventId={selected.id}
                    reviews={reviews}
                    currentUserId={user?.id ?? null}
                    isLoggedIn={Boolean(user)}
                  />
                }
              />
            </div>
          </>
        )}
      </Container>
    </div>
  );
}

function eventPillLabel(name: string) {
  const numbered = name.match(/ufc\s+\d+/i);
  if (numbered) {
    return numbered[0].replace(/\s+/, " ").toUpperCase();
  }
  const head = name.split(":")[0]?.trim();
  return head || name;
}
