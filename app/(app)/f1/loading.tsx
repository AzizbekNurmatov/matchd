import { Container } from "@/components/layout/container";
import { MatchCardSkeletonList } from "@/components/ui/match-card-skeleton";

export default function F1Loading() {
  return (
    <Container className="py-12 sm:py-14">
      <div className="h-1 w-14 animate-pulse rounded bg-red-600/70" />
      <div className="mt-4 h-3 w-28 animate-pulse rounded bg-slate-300" />
      <div className="mt-4 h-10 w-24 animate-pulse rounded bg-slate-300" />
      <MatchCardSkeletonList count={3} accent="red" />
    </Container>
  );
}
