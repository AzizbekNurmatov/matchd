import { formatRating } from "@/lib/ratings";
import { formatMonthYear } from "@/lib/dates";
import type { ProfileHeaderData } from "@/components/profile/types";

export function ProfileHeader({ profile }: { profile: ProfileHeaderData }) {
  return (
    <section className="rounded-lg border border-border bg-[#161616] px-5 py-8 sm:px-8">
      <h1 className="font-serif text-4xl tracking-tight text-[#f4f4f0]">
        {profile.username}
      </h1>
      <p className="mt-2 text-sm text-[#8e8e8e]">
        Member since {formatMonthYear(profile.createdAt)}
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <StatPill
          value={String(profile.matchesRated)}
          label={profile.matchesRated === 1 ? "Match" : "Matches"}
        />
        <StatPill
          value={String(profile.reviewsWritten)}
          label={profile.reviewsWritten === 1 ? "Review" : "Reviews"}
        />
        <StatPill
          value={
            profile.averageRating != null
              ? formatRating(profile.averageRating)
              : "—"
          }
          label="Average"
          accent
        />
      </div>
    </section>
  );
}

function StatPill({
  value,
  label,
  accent = false,
}: {
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="inline-flex items-baseline gap-2 rounded-md border border-border px-3 py-2">
      <span
        className={
          accent
            ? "font-serif text-xl tracking-tight text-[#e4b42a]"
            : "font-serif text-xl tracking-tight text-[#f4f4f0]"
        }
      >
        {value}
      </span>
      <span className="text-xs uppercase tracking-[0.16em] text-[#8e8e8e]">
        {label}
      </span>
    </div>
  );
}
