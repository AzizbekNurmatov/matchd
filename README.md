# matchd

matchd is a football match log. Fans browse fixtures, rate the game they watched (0.5–5.0 stars), write a short review, and see what other supporters made of the same ninety minutes.

The product is not a live-score ticker. Scores and fixtures are imported from [Football-Data.org](https://www.football-data.org/), stored in Postgres, and read by the app. Ratings, reviews, and profile flair live in the same database.

## What you can do

- **Browse matches** at `/matches` — recent results, upcoming fixtures, or a combined list, filtered by league.
- **Open a match** at `/matches/[id]` — scoreline, community average, your rating, and the review thread.
- **Rate** with half-star steps from 0.5 to 5.0. One rating per user per match.
- **Review** independently of rating (you can rate without writing, and the other way around).
- **Keep a profile** at `/users/[username]` — ratings archive, reviews, member stats, and a season matchday log (August–July).
- **Edit your profile** — username, photo, nationality, and a favorite club. Photos go to the Supabase `avatars` bucket. Reviews show the avatar (or initials), flag, and club crest.

Supported competitions:

| Code | League |
| --- | --- |
| `PL` | Premier League |
| `PD` | La Liga |
| `CL` | UEFA Champions League |
| `BL1` | Bundesliga |
| `SA` | Serie A |
| `FL1` | Ligue 1 |

## How it works

```
Football-Data.org  →  sync job (CLI or cron)
                          ↓
                     Supabase Postgres
                          ↓
              Next.js (App Router, cached catalog)
                          ↓
              Browser: browse, rate, review, profile
```

1. **Ingest.** `lib/sports-data/sync.ts` pulls competition fixtures from Football-Data.org v4, maps statuses (`TIMED`/`SCHEDULED` → `scheduled`, `IN_PLAY` → `live`), and upserts competitions, teams, and matches. The service-role key is used so writes bypass RLS.
2. **Read.** Pages query Postgres, not the sports API. The matches catalog is wrapped in `unstable_cache` (`lib/sports-data/queries.ts`) with a 5-minute TTL and the `matches` tag. Tab switches on `/matches` are client-side; league changes prefetch the cached payload.
3. **Refresh.** Cron (`GET /api/cron/sync`, see `vercel.json`) syncs a ±2 day window across all leagues, then `revalidateTag('matches')` so new scores show up without waiting for the TTL. The checked-in schedule is hourly (`0 * * * *`). Vercel Hobby rejects anything more frequent than once a day, so a Hobby project needs a daily expression such as `0 0 * * *`. Pro can keep the hourly job.
4. **Accounts.** Supabase Auth. A trigger creates a `profiles` row on signup. Session cookies are refreshed in `proxy.ts`.
5. **Community data.** `match_ratings` and `reviews` are per user per match. A `match_rating_stats` view supplies average and count for match pages.

Ratings never go to Football-Data.org. The sports API is write-once ingest; everything social is first-party.

## Stack

| Layer | Choice |
| --- | --- |
| App | [Next.js](https://nextjs.org/) 16 (App Router) + React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 4, dark editorial UI |
| Auth + DB | [Supabase](https://supabase.com/) (Auth, Postgres, RLS) |
| Fixtures | Football-Data.org v4 |
| Flags | [Flagcdn](https://flagcdn.com/) SVGs (not OS emoji fonts) |
| Hosting | Vercel (cron; daily on Hobby, hourly on Pro) |

Schema lives in `supabase/migrations/`. Apply it in the Supabase SQL editor or with `supabase db push`.

Main tables: `profiles`, `competitions`, `teams`, `matches`, `match_ratings`, `reviews`.

## Local setup

**Requirements:** Node.js 20+, a Supabase project, a Football-Data.org API key.

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Used for |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser and cookie-bound server client |
| `SUPABASE_SERVICE_ROLE_KEY` | Sync jobs only — never send to the client |
| `FOOTBALL_DATA_API_KEY` | Fixture ingest |
| `CRON_SECRET` | Required if the cron is enabled. The route accepts only `Authorization: Bearer <CRON_SECRET>`. Vercel sends that header when this variable is set. |

Run the SQL in `supabase/migrations/` against the project, in order:

- `0001_init.sql` — schema
- `0002_profile_flair.sql` — country and favorite club
- `0003_avatars.sql` — public `avatars` storage bucket (2MB, PNG/JPEG/WebP) and per-user write policies

Backfill fixtures (rate-limited; `sync:all` waits between leagues):

```bash
npm run sync:pl        # Premier League, current season
npm run sync:laliga
npm run sync:cl
npm run sync:all       # every supported league
npx tsx scripts/sync-league.ts PD 2024   # explicit season
```

Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run lint` | ESLint |
| `npm run sync:*` | Football-Data.org → Supabase backfill |

## Routes

| Path | What it is |
| --- | --- |
| `/` | Discover / featured matches |
| `/matches` | Catalog (recent / upcoming / all, by league) |
| `/matches/[id]` | Match page: rating, reviews |
| `/users/[username]` | Public profile: stats, matchday log, ratings, reviews |
| `/login`, `/signup` | Auth |
| `/api/cron/sync` | Fixture refresh (bearer token) |

## Repo layout

```
app/                 routes, layouts, cron handler
components/          ratings, reviews, profile, avatars, layout
lib/sports-data/     provider, sync, cached catalog queries
lib/supabase/        browser, server, and admin clients
lib/actions/         profile updates (username, flair, avatar)
supabase/migrations/ Postgres schema and the avatars bucket
scripts/             CLI backfill
types/database.ts    generated-style DB types
```
