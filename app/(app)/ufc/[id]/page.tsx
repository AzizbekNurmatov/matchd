import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { UfcEventCard } from "@/components/ufc/ufc-event-card";
import { Container } from "@/components/layout/container";
import { getUfcEvent } from "@/lib/ufc/queries";

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

  return (
    <Container className="py-12 sm:py-14">
      <Link
        href="/"
        className="text-xs text-[#475569] hover:text-[#0B132B]"
      >
        ← Discover
      </Link>
      <div className="mt-6">
        <UfcEventCard event={event} showDetailsLink={false} />
      </div>
      <section className="mt-8 rounded-lg border border-[#BAC2CB] bg-white p-5 shadow-card">
        <h2 className="text-xs uppercase tracking-[0.18em] text-[#475569]">
          Fan reviews
        </h2>
        <p className="mt-3 text-sm text-[#475569]">
          Written reviews for this card are not up yet. Star ratings on each
          bout are saved to your account.
        </p>
      </section>
    </Container>
  );
}
