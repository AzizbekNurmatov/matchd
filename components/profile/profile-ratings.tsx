import Link from "next/link";
import { MatchStrip } from "@/components/profile/match-strip";
import type { ProfileRatingItem } from "@/components/profile/types";
import { StarDisplay } from "@/components/ratings/star-display";
import { formatRelativeTime } from "@/lib/dates";
import { formatRating } from "@/lib/ratings";

type ProfileRatingsProps = {
  username: string;
  ratings: ProfileRatingItem[];
};

export function ProfileRatings({ username, ratings }: ProfileRatingsProps) {
  if (ratings.length === 0) {
    return (
      <p className="text-sm text-[#8e8e8e]">
        {username} hasn&apos;t rated any matches yet.
      </p>
    );
  }

  return (
    <ol className="grid gap-4 sm:grid-cols-2">
      {ratings.map((item) => (
        <li key={item.id}>
          <Link
            href={`/matches/${item.match.id}`}
            className="group flex h-full flex-col rounded-lg border border-border bg-[#161616] p-4 transition-colors hover:border-[#383838] hover:bg-[#1c1c1c]"
          >
            <div className="flex items-center justify-between gap-3 text-xs text-[#8e8e8e]">
              <span className="truncate">
                {item.match.competitionName ?? "Match"}
              </span>
              <span className="shrink-0">
                {formatRelativeTime(item.createdAt)}
              </span>
            </div>

            <div className="mt-4">
              <MatchStrip match={item.match} />
            </div>

            <div className="mt-auto flex items-center justify-between pt-4">
              <StarDisplay value={item.rating} size={16} />
              <span className="font-serif text-lg text-[#e4b42a]">
                {formatRating(item.rating)}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ol>
  );
}
