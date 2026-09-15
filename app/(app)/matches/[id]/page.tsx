import { Container } from "@/components/layout/container";

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Container className="py-12">
      <p className="text-sm text-muted">Match</p>
      <h1 className="mt-2 font-serif text-3xl tracking-tight">
        Home vs Away
      </h1>
      <p className="mt-2 text-sm text-muted">
        Competition · kickoff · status
      </p>

      <section className="mt-10 border-t border-border pt-8">
        <h2 className="text-sm text-muted">Score</h2>
        <p className="mt-2 font-serif text-4xl tracking-tight">–</p>
      </section>

      <section className="mt-10 border-t border-border pt-8">
        <h2 className="text-sm text-muted">Community rating</h2>
        <p className="mt-2 font-serif text-3xl tracking-tight text-accent">
          —
        </p>
        <p className="mt-1 text-sm text-muted">No ratings yet</p>
      </section>

      <section className="mt-10 border-t border-border pt-8">
        <h2 className="text-sm text-muted">Your rating</h2>
        <p className="mt-2 text-sm text-muted">
          Half-star ratings from 0.5 to 5 will go here.
        </p>
      </section>

      <section className="mt-10 border-t border-border pt-8">
        <h2 className="text-sm text-muted">Reviews</h2>
        <p className="mt-2 text-sm text-muted">
          Fan reviews for this match will appear here. Placeholder id: {id}
        </p>
      </section>
    </Container>
  );
}
