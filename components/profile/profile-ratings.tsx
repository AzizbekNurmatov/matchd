import Link from "next/link";
import { MatchStrip } from "@/components/profile/match-strip";
import type { ProfileRatingItem, ProfileUfcRating } from "@/components/profile/types";
import { StarDisplay } from "@/components/ratings/star-display";
import { formatRelativeTime } from "@/lib/dates";
import { formatCompactFightResult } from "@/lib/ufc/format";
import { formatRating } from "@/lib/ratings";
import { cn } from "@/lib/utils";

type RatingSport = "all" | "football" | "ufc";

type ProfileRatingsProps = {
  username: string;
  ratings: ProfileRatingItem[];
  ufcRatings: ProfileUfcRating[];
  sport: RatingSport;
  profilePath: string;
};

export function ProfileRatings({
  username,
  ratings,
  ufcRatings,
  sport,
  profilePath,
}: ProfileRatingsProps) {
  const showFootball = sport !== "ufc";
  const showUfc = sport !== "football";
  const visibleFootball = showFootball ? ratings : [];
  const visibleUfc = showUfc ? ufcRatings : [];

  return (
    <div>
      <div className="mb-6 flex gap-2">
        <SportLink href={profilePath} active={sport === "all"}>
          All
        </SportLink>
        <SportLink href={`${profilePath}?sport=football`} active={sport === "football"}>
          Football
        </SportLink>
        <SportLink href={`${profilePath}?sport=ufc`} active={sport === "ufc"}>
          UFC
        </SportLink>
      </div>

      {visibleFootball.length === 0 && visibleUfc.length === 0 ? (
        <p className="text-sm text-[#475569]">
          {username} hasn&apos;t rated any{" "}
          {sport === "ufc" ? "fights" : sport === "football" ? "matches" : "bouts"}{" "}
          yet.
        </p>
      ) : (
        <ol className="grid gap-4 sm:grid-cols-2">
          {visibleUfc.map((item) => (
            <li key={item.id}>
              <UfcRatingCard item={item} />
            </li>
          ))}
          {visibleFootball.map((item) => (
            <li key={item.id}>
              <FootballRatingCard item={item} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function SportLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      className={cn(
        "rounded-sm border px-2.5 py-1 text-xs font-semibold uppercase tracking-wider",
        active
          ? "border-[#0B132B] bg-[#0B132B] text-white"
          : "border-[#BAC2CB] text-[#475569] hover:text-[#0B132B]",
      )}
    >
      {children}
    </Link>
  );
}

function UfcRatingCard({ item }: { item: ProfileUfcRating }) {
  const winner = item.winnerName;
  const line =
    winner === item.fighterAName
      ? `${item.fighterAName} def. ${item.fighterBName}`
      : winner === item.fighterBName
        ? `${item.fighterBName} def. ${item.fighterAName}`
        : `${item.fighterAName} vs ${item.fighterBName}`;
  const result = formatCompactFightResult(item.method, item.details);

  return (
    <Link
      href={`/ufc/${item.eventId}`}
      className="group flex h-full flex-col rounded-lg border border-border bg-white p-4 shadow-card transition-colors hover:border-[#94A3B8]"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex rounded-sm border border-[#DC2626] bg-[#FEE2E2] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#991B1B]">
          UFC
        </span>
        <span className="text-xs text-[#475569]">
          {formatRelativeTime(item.createdAt)}
        </span>
      </div>
      <p className="mt-3 text-sm font-medium text-[#0B132B]">{line}</p>
      {result ? (
        <p className="mt-1 text-[11px] font-semibold tracking-wide text-[#991B1B]">
          {result}
        </p>
      ) : null}
      <p className="mt-1 truncate text-xs text-[#475569]">{item.eventName}</p>
      <div className="mt-auto flex items-center justify-between pt-4">
        <StarDisplay value={item.rating} size={16} />
        <span className="font-serif text-lg text-[#B45309]">
          {formatRating(item.rating)}
        </span>
      </div>
    </Link>
  );
}

function FootballRatingCard({ item }: { item: ProfileRatingItem }) {
  return (
    <Link
      href={`/matches/${item.match.id}`}
      className="group flex h-full flex-col rounded-lg border border-border bg-[#F4F6F8] p-4 transition-colors hover:border-[#94A3B8] hover:bg-[#E8ECEE]"
    >
      <div className="flex items-center justify-between gap-3 text-xs text-[#475569]">
        <span className="truncate">{item.match.competitionName ?? "Match"}</span>
        <span className="shrink-0">{formatRelativeTime(item.createdAt)}</span>
      </div>
      <div className="mt-4">
        <MatchStrip match={item.match} />
      </div>
      <div className="mt-auto flex items-center justify-between pt-4">
        <StarDisplay value={item.rating} size={16} />
        <span className="font-serif text-lg text-[#B45309]">
          {formatRating(item.rating)}
        </span>
      </div>
    </Link>
  );
}
