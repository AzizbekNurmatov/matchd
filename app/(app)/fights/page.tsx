import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { UfcEventCard } from "@/components/ufc/ufc-event-card";
import { UfcEventDiscussion } from "@/components/ufc/ufc-event-discussion";
import { UfcEventSelector } from "@/components/ufc/ufc-event-selector";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { getUfcEventReviews, listUfcEvents } from "@/lib/ufc/queries";

export const metadata: Metadata = {
  title: "Fights",
};

export default async function FightsPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string; tab?: string }>;
}) {
  const { event: requestedId, tab: requestedTab } = await searchParams;
  const events = await listUfcEvents();
  const tab = requestedTab === "completed" ? "completed" : "upcoming";
  const filtered = events.filter((event) =>
    tab === "completed" ? isFinishedCard(event.status) : !isFinishedCard(event.status),
  );
  const selected =
    filtered.find((event) => event.id === requestedId) ?? filtered[0] ?? null;
  const reviews = selected ? await getUfcEventReviews(selected.id) : [];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div>
      <Container className="py-12 sm:py-14">
        <header className="border-b border-[#CBD2D9] pb-6">
          <div className="h-1 w-14 bg-amber-500" />
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-amber-700">
            UFC // Main cards
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-[#0B132B] sm:text-5xl">
            FIGHTS
          </h1>
          <p className="mt-2 text-sm text-[#475569]">
            Pick a card to see the main event, the undercard, and the discussion.
          </p>
        </header>

        <div className="mt-8 flex gap-6 border-b border-[#CBD2D9]" role="tablist">
          <FightTab href="/fights?tab=upcoming" active={tab === "upcoming"}>
            Upcoming
          </FightTab>
          <FightTab href="/fights?tab=completed" active={tab === "completed"}>
            Completed
          </FightTab>
        </div>

        {filtered.length === 0 || !selected ? (
          <EmptyState
            title={
              tab === "upcoming"
                ? "No upcoming fight cards found."
                : "No past fight cards found."
            }
          />
        ) : (
          <>
            <UfcEventSelector
              events={filtered.map((event) => ({
                id: event.id,
                name: event.name,
                startsAt: event.startsAt,
              }))}
              selectedId={selected.id}
              tab={tab}
            />
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

function isFinishedCard(status: string) {
  return /finished|complete/i.test(status);
}

function FightTab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: string;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      role="tab"
      aria-selected={active}
      className={cn(
        "pb-2 text-xs font-semibold uppercase tracking-wider",
        active
          ? "border-b-2 border-amber-500 text-[#0F172A]"
          : "text-[#475569] hover:text-[#0F172A]",
      )}
    >
      {children}
    </Link>
  );
}
