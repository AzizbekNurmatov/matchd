import type { Metadata } from "next";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "Community Leaderboard",
};

export default function LeaderboardPage() {
  return (
    <Container className="py-12 sm:py-14">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8c887b]">
        Archive
      </p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight text-[#0B132B]">
        Community Leaderboard
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#475569]">
        Public ratings are collected on member profiles. A ranked board of the
        archive is still being set in type.
      </p>
    </Container>
  );
}
