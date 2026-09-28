import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { UfcBoutReviews } from "@/components/ufc/ufc-bout-reviews";
import { UfcEventCard } from "@/components/ufc/ufc-event-card";
import { Container } from "@/components/layout/container";
import { createClient } from "@/lib/supabase/server";
import { getUfcEvent, getUfcEventReviews } from "@/lib/ufc/queries";

type UfcEventPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: UfcEventPageProps): Promise<Metadata> {
  const { id } = await params;
  const event = await getUfcEvent(id);
  return { title: event?.name ?? "UFC" };
}

export default async function UfcEventPage({ params }: UfcEventPageProps) {
  const { id } = await params;
  const event = await getUfcEvent(id);
  if (!event) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const reviews = await getUfcEventReviews(event.fights.map((fight) => fight.id));
  const mainEvent = event.fights[0];
  const reviewTargets = [
    ...(mainEvent ? [{ id: mainEvent.id, title: "This card" }] : []),
    ...event.fights.slice(mainEvent ? 1 : 0).map((fight) => ({
      id: fight.id,
      title: `${fight.fighterAName} vs ${fight.fighterBName}`,
    })),
  ];

  return (
    <Container className="py-12 sm:py-14">
      <Link href="/fights" className="text-xs text-[#475569] hover:text-[#0B132B]">
        ← Fights
      </Link>
      <div className="mt-6">
        <UfcEventCard event={event} showDetailsLink={false} />
      </div>
      <section className="mt-8 rounded-lg border border-[#BAC2CB] bg-white p-5 shadow-card">
        <h2 className="text-xs uppercase tracking-[0.18em] text-[#475569]">
          Fan reviews
        </h2>
        <div className="mt-6 flex flex-col gap-8">
          {reviewTargets.map((target) => (
            <UfcBoutReviews
              key={`${target.title}-${target.id}`}
              fightId={target.id}
              eventId={event.id}
              title={target.title}
              reviews={reviews.filter((review) => review.fightId === target.id)}
              currentUserId={user?.id ?? null}
              isLoggedIn={Boolean(user)}
            />
          ))}
        </div>
      </section>
    </Container>
  );
}
