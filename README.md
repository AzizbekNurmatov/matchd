# matchd

matchd is a fan log for football, UFC, and Formula 1. Browse a fixture, a fight card, or a Grand Prix, rate it from 0.5 to 5.0 stars, and write a short review. Scores and cards are imported, then read from Postgres. Ratings, reviews, and profile flair stay in the same database.

The product is not a live-score ticker.

## What you can do

- **Browse matches** at `/matches` — recent results, upcoming fixtures, or a combined list, filtered by league. A team search on the control bar filters the loaded list in the browser as you type. It does not call the API again.
- **Open a match** at `/matches/[id]` — scoreline, community average, your rating, and the review thread.
- **Rate** with half-star steps from 0.5 to 5.0. Hover fills the stars in warm gold; a click keeps the score on screen immediately, then saves. One rating per user per match, fight, or Grand Prix.
- **Review** independently of rating (you can rate without writing, and the other way around).
- **Browse fights** at `/fights` — UFC main cards, bout results, and fan ratings.
- **Browse Formula 1** at `/f1` — the current season’s Grand Prix weekends, split into Upcoming and Completed. Finished races highlight the P1 driver and constructor. Weekends that have not been run say the race is scheduled.
- **Search** at `/search` — opened from the header. The field is focused on load. Results update as you type and can include fighters, events, promotions, clubs, leagues, football fixtures, and Grand Prix cards.
- **Keep a profile** at `/users/[username]` — ratings archive, reviews, member stats, and a season matchday log (August–July).
- **Edit your profile** — username, photo, nationality, and a favorite club. Photos go to the Supabase `avatars` bucket. Reviews show the avatar (or initials), flag, and club crest.

Supported football competitions:

| Code | League |
| --- | --- |
| `PL` | Premier League |
| `PD` | La Liga |
| `CL` | UEFA Champions League |
| `BL1` | Bundesliga |
| `SA` | Serie A |
| `FL1` | Ligue 1 |
| `MLS` | MLS |

## How it works

```
Football-Data.org  →  football sync
API-Sports (MMA)   →  UFC sync
API-Sports (F1)    →  current-season calendar, cached
                          ↓
                     Supabase Postgres
                          ↓
              Next.js (App Router, cached reads)
                          ↓
              Browser: browse, search, rate, review
```

1. **Football ingest.** `lib/sports-data/sync.ts` pulls fixtures from Football-Data.org v4, maps statuses (`TIMED`/`SCHEDULED` → `scheduled`, `IN_PLAY` → `live`), and upserts competitions, teams, and matches. The service-role key is used so writes bypass RLS. MLS uses API-Sports football with the same key as the other API-Sports sports.
2. **UFC ingest.** `lib/ufc/sync.ts` reads a short window from API-Sports MMA and upserts events and fights.
3. **Formula 1.** `lib/f1/calendar.ts` asks API-Sports Formula 1 (`v1.formula-1.api-sports.io`) for the current calendar year, including completed and upcoming races. The free tier allows 10 requests a minute, so calls are spaced about 7 seconds apart. If that plan blocks the year, or the request is rate-limited, `/f1` reads the rows already stored in `f1_races` instead of failing the page.
4. **Read.** Catalog pages query Postgres, not the sports APIs, except for the F1 calendar fetch above. The matches catalog is wrapped in `unstable_cache` (`lib/sports-data/queries.ts`) with a 5-minute TTL and the `matches` tag. Tab switches on `/matches` are client-side; league changes prefetch the cached payload. Team search on that page is also client-side.
5. **Search.** `/search` queries fighters, events, clubs, leagues, fixtures, and stored or cached Grands Prix in memory on the server. An empty category does not hide the others.
6. **Refresh.** Cron (`GET /api/cron/sync` and `GET /api/cron/sync-ufc`, see `vercel.json`) refreshes football and UFC, then revalidates cached pages. `GET /api/cron/sync-f1` revalidates the F1 calendar. Each route accepts only `Authorization: Bearer <CRON_SECRET>`.
7. **Accounts.** Supabase Auth. A trigger creates a `profiles` row on signup. Session cookies are refreshed in `proxy.ts`.
8. **Community data.** `match_ratings`, `reviews`, `ufc_fight_ratings`, and `f1_race_ratings` are per user per event. A `match_rating_stats` view supplies average and count for football match pages.

Ratings never go back to the sports APIs.

## Stack

| Layer | Choice |
| --- | --- |
| App | [Next.js](https://nextjs.org/) 16 (App Router) + React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 4, light editorial UI with a faint viewport texture |
| Auth + DB | [Supabase](https://supabase.com/) (Auth, Postgres, RLS) |
| Football fixtures | Football-Data.org v4, plus API-Sports for MLS |
| UFC | API-Sports MMA |
| Formula 1 | API-Sports Formula 1 |
| Flags | [Flagcdn](https://flagcdn.com/) SVGs (not OS emoji fonts) |
| Hosting | Vercel (cron) |

Schema lives in `supabase/migrations/`. Apply it in the Supabase SQL editor or with `supabase db push`.

Main tables: `profiles`, `competitions`, `teams`, `matches`, `match_ratings`, `reviews`, `ufc_events`, `ufc_fights`, `ufc_fight_ratings`, `f1_races`, `f1_race_ratings`.

The app writes Formula 1 rows with `id`, `season`, `name`, `circuit`, `date`, `status`, `winner` (json), and `sessions` (json). `created_at` is filled by the database.

## Local setup

**Requirements:** Node.js 20+, a Supabase project, a Football-Data.org API key, and an API-Sports key for UFC, MLS, and Formula 1.

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
| `FOOTBALL_DATA_API_KEY` | Football fixture ingest |
| `MMA_API_KEY` | API-Sports key for MMA, football (MLS), and Formula 1. Server-only |
| `CRON_SECRET` | Required if the cron is enabled. The route accepts only `Authorization: Bearer <CRON_SECRET>`. Vercel sends that header when this variable is set. |

Run the SQL in `supabase/migrations/` against the project, in order:

- `0001_init.sql` — schema
- `0002_profile_flair.sql` — country and favorite club
- `0003_avatars.sql` — public `avatars` storage bucket (2MB, PNG/JPEG/WebP) and per-user write policies
- `0004_ufc.sql` — UFC events, fights, and ratings
- `0005_ufc_event_reviews.sql` — event-level fight reviews
- `0006_f1.sql` — Formula 1 races and ratings
- `0007_f1_circuit_image.sql` — adds `circuit_image` if that column is missing

The hosted `f1_races` table the app writes is the column list above. If an older table is missing one of those columns, add it before saving Grands Prix. Star ratings need `f1_race_ratings`.

Backfill football fixtures (rate-limited; `sync:all` waits between leagues):

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

## Scripts and Stuff

| Command | Purpose |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run lint` | ESLint |
| `npm run sync:*` | Football-Data.org → Supabase backfill |

## Routes

| Path | What it is |
| --- | --- |
| `/` | Discover / featured matches and the latest UFC card |
| `/matches` | Catalog (recent / upcoming / all, by league) plus team search |
| `/matches/[id]` | Match page: rating, reviews |
| `/fights` | UFC cards |
| `/f1` | Current-season Grands Prix, Upcoming and Completed |
| `/search` | Fighters, events, clubs, leagues, fixtures, and races |
| `/users/[username]` | Public profile: stats, matchday log, ratings, reviews |
| `/login`, `/signup` | Auth |
| `/api/cron/sync` | Football fixture refresh (bearer token) |
| `/api/cron/sync-ufc` | UFC refresh (bearer token) |
| `/api/cron/sync-f1` | Revalidate the F1 calendar (bearer token) |

## Repo layout

```
app/                 routes, layouts, cron handlers
components/          ratings, reviews, matches, UFC, F1, profile, layout
lib/sports-data/     football provider, sync, cached catalog queries
lib/ufc/             MMA client, sync, and fight queries
lib/f1/              Formula 1 client, calendar, and race queries
lib/search.ts        combined search across football, UFC, and F1
lib/supabase/        browser, server, and admin clients
lib/actions/         profile updates (username, flair, avatar)
supabase/migrations/ Postgres schema and the avatars bucket
scripts/             CLI backfill
types/database.ts    generated-style DB types
```
