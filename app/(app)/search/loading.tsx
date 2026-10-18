import { Container } from "@/components/layout/container";
import { MatchCardSkeletonList } from "@/components/ui/match-card-skeleton";

export default function SearchLoading() {
  return (
    <Container className="py-12 sm:py-14">
      <div className="h-3 w-28 animate-pulse rounded bg-slate-300" />
      <div className="mt-4 h-10 w-40 animate-pulse rounded bg-slate-300" />
      <div className="mt-8 h-12 animate-pulse rounded-sm bg-slate-300" />
      <MatchCardSkeletonList count={3} />
    </Container>
  );
}