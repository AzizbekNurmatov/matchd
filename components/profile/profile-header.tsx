import { CountryFlag } from "@/components/country-flag";
import { EditProfileModal } from "@/components/profile/edit-profile-modal";
import type { ProfileHeaderData } from "@/components/profile/types";
import { formatMonthYear } from "@/lib/dates";
import { formatRating } from "@/lib/ratings";
import { getCountryName } from "@/lib/utils/countries";

export function ProfileHeader({
  profile,
  isOwn,
}: {
  profile: ProfileHeaderData;
  isOwn: boolean;
}) {
  const countryName = getCountryName(profile.countryCode);

  return (
    <section className="rounded-lg border border-border bg-[#161616] px-5 py-8 sm:px-8">
      <div className="flex items-start justify-between gap-4">
        <h1 className="flex items-center gap-2.5 font-serif text-4xl tracking-tight text-[#f4f4f0]">
          {profile.username}
          <CountryFlag
            code={profile.countryCode}
            title={countryName ?? undefined}
            className="h-[15px] w-5 rounded-xs"
          />
        </h1>
        {isOwn ? (
          <EditProfileModal
            initialUsername={profile.username}
            countryCode={profile.countryCode}
            favoriteTeam={profile.favoriteTeam}
          />
        ) : null}
      </div>
      <p className="mt-2 text-sm text-[#8e8e8e]">
        Member since {formatMonthYear(profile.createdAt)}
      </p>

      {profile.favoriteTeam ? (
        <div className="mt-4 inline-flex items-center gap-2 border border-[#242426] bg-[#151516] px-2.5 py-1.5">
          {profile.favoriteTeam.crest_url ? (
            <img
              src={profile.favoriteTeam.crest_url}
              alt=""
              className="h-[18px] w-[18px] object-contain"
            />
          ) : (
            <span className="flex h-[18px] w-[18px] items-center justify-center font-mono text-[9px] text-[#8c887b]">
              {profile.favoriteTeam.name.slice(0, 1)}
            </span>
          )}
          <span className="text-xs font-mono uppercase tracking-wider text-[#8c887b]">
            {profile.favoriteTeam.name}
          </span>
        </div>
      ) : null}

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
