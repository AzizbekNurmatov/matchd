import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "Discover",
};

export default function HomePage() {
  return (
    <Container className="py-16">
      <p className="font-serif text-sm text-accent">matchd</p>
      <h1 className="mt-3 max-w-md font-serif text-4xl leading-tight tracking-tight">
        The matches you watched, remembered together.
      </h1>
      <p className="mt-4 max-w-md text-muted">
        Discover soccer matches, rate them, and read what other fans thought.
        More Letterboxd than a live-score ticker.
      </p>
      <Link
        href="/matches"
        className="mt-8 inline-block text-sm text-foreground underline decoration-border underline-offset-4 hover:decoration-accent"
      >
        Browse matches
      </Link>
    </Container>
  );
}
