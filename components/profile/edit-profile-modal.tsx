"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { CountryFlag } from "@/components/country-flag";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  searchTeams,
  updateUserProfile,
  type TeamSearchLeague,
  type TeamSearchResult,
} from "@/lib/actions/profile";
import { createClient } from "@/lib/supabase/client";
import { FOOTBALL_COUNTRIES } from "@/lib/utils/countries";
import { cn } from "@/lib/utils";

const AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

const LEAGUE_FILTERS: { id: TeamSearchLeague; label: string }[] = [
  { id: "all", label: "All" },
  { id: "PL", label: "Premier League" },
  { id: "PD", label: "La Liga" },
  { id: "CL", label: "Champions League" },
  { id: "BL1", label: "Bundesliga" },
  { id: "SA", label: "Serie A" },
  { id: "FL1", label: "Ligue 1" },
];

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

type EditProfileModalProps = {
  initialUsername: string;
  initialAvatarUrl: string | null;
  countryCode: string | null;
  favoriteTeam: TeamSearchResult | null;
};

export function EditProfileModal({
  initialUsername,
  initialAvatarUrl,
  countryCode,
  favoriteTeam,
}: EditProfileModalProps) {
  const router = useRouter();
  const titleId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState(initialUsername);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [country, setCountry] = useState(countryCode ?? "");
  const [selectedTeam, setSelectedTeam] = useState<TeamSearchResult | null>(
    favoriteTeam,
  );
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const busy = isPending || uploading;

  function openModal() {
    setUsername(initialUsername);
    setAvatarUrl(initialAvatarUrl);
    setCountry(countryCode ?? "");
    setSelectedTeam(favoriteTeam);
    setError(null);
    setOpen(true);
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function close() {
    if (busy) {
      return;
    }
    setOpen(false);
  }

  async function onAvatarFile(file: File | undefined) {
    if (!file) {
      return;
    }

    if (!AVATAR_TYPES.includes(file.type as (typeof AVATAR_TYPES)[number])) {
      setError("Use a PNG, JPEG, or WebP image.");
      return;
    }

    if (file.size > AVATAR_MAX_BYTES) {
      setError("Photos must be 2MB or smaller.");
      return;
    }

    setError(null);
    setUploading(true);

    const extension =
      file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You need to log in to upload a photo.");
        return;
      }

      const path = `${user.id}/${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadError) {
        setError("Could not upload that photo. Try again.");
        return;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
    } finally {
      setUploading(false);
      if (fileRef.current) {
        fileRef.current.value = "";
      }
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (uploading) {
      return;
    }
    setError(null);

    const trimmedUsername = username.trim();
    if (!USERNAME_PATTERN.test(trimmedUsername)) {
      setError(
        "Usernames must be 3-20 characters and use only letters, numbers, and underscores.",
      );
      return;
    }

    startTransition(async () => {
      const result = await updateUserProfile({
        username: trimmedUsername,
        avatarUrl,
        countryCode: country || null,
        favoriteTeamId: selectedTeam?.id ?? null,
      });

      if ("error" in result) {
        setError(result.error);
        return;
      }

      setOpen(false);
      if (result.newUsername !== initialUsername.trim().toLowerCase()) {
        router.push(`/users/${result.newUsername}`);
        return;
      }

      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="shrink-0 border border-[#CBD2D9] bg-[#E8ECEE] px-3 py-1 font-mono text-xs uppercase tracking-wider text-[#0F172A] transition-colors hover:border-[#9A3412]"
      >
        Edit Profile
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#0F172A]/40 px-4 py-16 sm:items-center">
          <button
            type="button"
            aria-label="Close edit profile"
            className="absolute inset-0 cursor-default"
            onClick={close}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 w-full max-w-lg border border-[#CBD2D9] bg-[#F4F6F8] p-5 shadow-2xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#475569]">
                  Supporter Flair
                </p>
                <h2
                  id={titleId}
                  className="mt-2 font-[family-name:var(--font-bebas)] text-3xl tracking-wide text-[#0F172A]"
                >
                  EDIT PROFILE
                </h2>
              </div>
              <button
                type="button"
                onClick={close}
                className="font-mono text-xs uppercase tracking-wider text-[#475569] hover:text-[#0F172A]"
              >
                Close
              </button>
            </div>

            <form className="mt-6 flex flex-col gap-5" onSubmit={onSubmit}>
              <div className="flex items-center gap-4">
                <UserAvatar
                  size="lg"
                  src={avatarUrl}
                  username={username.trim() || initialUsername}
                />
                <div className="flex min-w-0 flex-col items-start gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#475569]">
                    Avatar
                  </span>
                  <div className="flex flex-wrap items-center gap-3">
                    <label
                      className={cn(
                        "cursor-pointer border border-[#CBD2D9] bg-[#E8ECEE] px-3 py-1 font-mono text-xs uppercase tracking-wider text-[#0F172A] transition-colors hover:border-[#9A3412]",
                        busy && "pointer-events-none opacity-70",
                      )}
                    >
                      {uploading ? "Uploading..." : "Upload Photo"}
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        disabled={busy}
                        className="sr-only"
                        onChange={(event) => {
                          void onAvatarFile(event.target.files?.[0]);
                        }}
                      />
                    </label>
                    {avatarUrl ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setAvatarUrl(null)}
                        className="font-mono text-xs uppercase tracking-wider text-[#475569] hover:text-[#0F172A] disabled:opacity-70"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                  <span className="text-xs text-[#475569]">
                    PNG, JPEG, or WebP. 2MB max.
                  </span>
                </div>
              </div>

              <label className="flex flex-col gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-[#475569]">
                  USERNAME
                </span>
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  disabled={busy}
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full rounded-none border border-[#CBD2D9] bg-[#E4E7EB] px-3 py-2 font-mono text-sm tracking-wide text-[#0F172A] outline-none focus:border-[#9A3412] disabled:opacity-70"
                />
                <span className="text-xs text-[#475569]">
                  3-20 characters, letters, numbers, and underscores only.
                </span>
              </label>

              <CountryCombobox
                value={country}
                onChange={setCountry}
                disabled={busy}
              />

              <ClubPicker
                selectedTeam={selectedTeam}
                onSelect={setSelectedTeam}
                disabled={busy}
              />

              {error ? (
                <p
                  role="alert"
                  className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                >
                  {error}
                </p>
              ) : null}

              <div className="mt-1 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={close}
                  disabled={busy}
                  className="font-mono text-xs uppercase tracking-wider text-[#475569] hover:text-[#0F172A] disabled:opacity-70"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="border border-[#0F172A] bg-[#0F172A] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[#F8FAFC] transition-colors hover:bg-[#1E293B] disabled:opacity-70"
                >
                  {isPending ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function CountryCombobox({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (code: string) => void;
  disabled: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const selected = FOOTBALL_COUNTRIES.find((country) => country.code === value);

  const options = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) {
      return FOOTBALL_COUNTRIES;
    }
    return FOOTBALL_COUNTRIES.filter(
      (country) =>
        country.name.toLowerCase().includes(needle) ||
        country.code.toLowerCase().includes(needle),
    );
  }, [filter]);

  useEffect(() => {
    if (!open) {
      return;
    }

    searchRef.current?.focus();

    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  function select(code: string) {
    onChange(code);
    setFilter("");
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="flex flex-col gap-2">
      <span className="font-mono text-[11px] uppercase tracking-wider text-[#475569]">
        Country
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 w-full items-center justify-between gap-3 border border-[#CBD2D9] bg-[#E4E7EB] px-3 text-left outline-none hover:border-[#94A3B8] focus:border-[#9A3412] disabled:opacity-70"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          {selected ? (
            <>
              <CountryFlag code={selected.code} className="h-[15px] w-5" />
              <span className="truncate text-sm text-[#0F172A]">
                {selected.name}
              </span>
            </>
          ) : (
            <span className="text-sm text-[#475569]">No country</span>
          )}
        </span>
        <span className="font-mono text-[10px] text-[#475569]">
          {open ? "▴" : "▾"}
        </span>
      </button>

      {open ? (
        <div className="border border-[#CBD2D9] bg-[#E8ECEE]">
          <input
            ref={searchRef}
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Search countries..."
            autoComplete="off"
            className="h-10 w-full border-b border-[#CBD2D9] bg-[#E4E7EB] px-3 text-sm text-[#0F172A] outline-none placeholder:text-[#475569] focus:border-[#9A3412]"
          />
          <div className="max-h-56 overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => select("")}
              className={cn(
                "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-[#F4F6F8]",
                value === "" ? "text-[#0F172A]" : "text-[#475569]",
              )}
            >
              No country
            </button>
            {options.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => select(country.code)}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-[#F4F6F8]",
                  country.code === value ? "bg-[#F4F6F8]" : null,
                )}
              >
                <CountryFlag code={country.code} className="h-[15px] w-5" />
                <span className="truncate text-sm text-[#0F172A]">
                  {country.name}
                </span>
              </button>
            ))}
            {options.length === 0 ? (
              <p className="px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-[#475569]">
                No countries found
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ClubPicker({
  selectedTeam,
  onSelect,
  disabled,
}: {
  selectedTeam: TeamSearchResult | null;
  onSelect: (team: TeamSearchResult | null) => void;
  disabled: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [league, setLeague] = useState<TeamSearchLeague>("all");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TeamSearchResult[]>([]);
  const [listOpen, setListOpen] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const shouldSearch = league !== "all" || query.trim().length > 0;
      if (!shouldSearch) {
        setResults([]);
        setSearching(false);
        return;
      }

      setSearching(true);
      void searchTeams(query, league).then((teams) => {
        setResults(teams);
        setSearching(false);
      });
    }, 250);

    return () => window.clearTimeout(handle);
  }, [query, league]);

  useEffect(() => {
    if (!listOpen) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setListOpen(false);
      }
    }

    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [listOpen]);

  function selectLeague(next: TeamSearchLeague) {
    setLeague(next);
    setListOpen(true);
  }

  const emptyHint =
    league === "all" && query.trim().length === 0
      ? "Type to search or pick a league"
      : "No clubs found";

  return (
    <div ref={rootRef} className="flex flex-col gap-2">
      <span className="font-mono text-[11px] uppercase tracking-wider text-[#475569]">
        Favorite Club
      </span>

      <div className="flex flex-wrap gap-1.5">
        {LEAGUE_FILTERS.map((item) => {
          const active = item.id === league;
          return (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              onClick={() => selectLeague(item.id)}
              className={cn(
                "border px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors disabled:opacity-70",
                active
                  ? "border-[#9A3412] bg-[#E8ECEE] text-[#0F172A]"
                  : "border-[#CBD2D9] text-[#475569] hover:border-[#94A3B8] hover:text-[#0F172A]",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {selectedTeam ? (
        <div className="flex items-center justify-between gap-3 border border-[#CBD2D9] bg-[#E4E7EB] px-3 py-2">
          <span className="flex min-w-0 items-center gap-2.5">
            <ClubCrest team={selectedTeam} size={20} />
            <span className="min-w-0">
              <span className="block truncate text-sm text-[#0F172A]">
                {selectedTeam.name}
              </span>
              {selectedTeam.leagueName ? (
                <span className="block text-xs text-[#475569]">
                  {selectedTeam.leagueName}
                </span>
              ) : null}
            </span>
          </span>
          <button
            type="button"
            onClick={() => onSelect(null)}
            disabled={disabled}
            className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-[#475569] hover:text-[#0F172A] disabled:opacity-70"
          >
            Clear
          </button>
        </div>
      ) : null}

      <div className="relative">
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setListOpen(true);
          }}
          onFocus={() => setListOpen(true)}
          disabled={disabled}
          placeholder="Search clubs..."
          autoComplete="off"
          className="h-10 w-full border border-[#CBD2D9] bg-[#E4E7EB] px-3 text-sm text-[#0F172A] outline-none placeholder:text-[#475569] focus:border-[#9A3412] disabled:opacity-70"
        />

        {listOpen ? (
          <div className="absolute inset-x-0 z-20 mt-1 max-h-64 overflow-y-auto border border-[#CBD2D9] bg-[#E8ECEE] py-1">
            {searching && results.length === 0 ? (
              <p className="px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-[#475569]">
                Searching...
              </p>
            ) : results.length === 0 ? (
              <p className="px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-[#475569]">
                {emptyHint}
              </p>
            ) : (
              results.map((team) => (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => {
                    onSelect(team);
                    setQuery("");
                    setListOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-[#F4F6F8]"
                >
                  <ClubCrest team={team} size={24} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-[#0F172A]">
                      {team.name}
                    </span>
                    {team.leagueName ? (
                      <span className="block truncate text-xs text-[#475569]">
                        {team.leagueName}
                      </span>
                    ) : null}
                  </span>
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ClubCrest({
  team,
  size,
}: {
  team: Pick<TeamSearchResult, "name" | "crest_url">;
  size: 20 | 24;
}) {
  const px = size === 24 ? "h-6 w-6" : "h-5 w-5";
  if (team.crest_url) {
    return (
      <img
        src={team.crest_url}
        alt=""
        className={cn("shrink-0 object-contain", px)}
      />
    );
  }

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center bg-[#F4F6F8] font-mono text-[9px] text-[#475569]",
        px,
      )}
    >
      {team.name.slice(0, 1)}
    </span>
  );
}
