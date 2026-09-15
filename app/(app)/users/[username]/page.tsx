import { Container } from "@/components/layout/container";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  return (
    <Container className="py-12">
      <h1 className="font-serif text-3xl tracking-tight">{username}</h1>
      <p className="mt-2 text-sm text-muted">
        Ratings and reviews from this fan will show up here.
      </p>
      <div className="mt-10 border-t border-border pt-8 text-sm text-muted">
        No activity yet.
      </div>
    </Container>
  );
}
