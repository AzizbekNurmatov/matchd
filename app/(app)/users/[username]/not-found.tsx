import Link from "next/link";
import { Container } from "@/components/layout/container";

export default function UserNotFound() {
  return (
    <Container className="py-16">
      <h1 className="font-serif text-3xl tracking-tight">Profile not found</h1>
      <p className="mt-3 text-sm text-muted">
        That fan is not on matchd yet.
      </p>
      <Link
        href="/matches"
        className="mt-8 inline-block text-sm text-foreground underline decoration-border hover:decoration-accent"
      >
        Back to matches
      </Link>
    </Container>
  );
}
