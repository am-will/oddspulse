# OddsPulse Project Overview

Generated: May 3, 2026

## What We Built

OddsPulse is a prediction-market trend dashboard for finding hot Polymarket and Kalshi markets. It ranks markets by a deterministic heat score and presents market movement, liquidity, source status, and related context in a polished dashboard UI.

The project started as a free-tier Polymarket/Kalshi radar called Polydash, then was renamed to OddsPulse and pivoted from Supabase to Convex for the backend.

## Current Location

Linux project:

```text
/home/amwill/Applications/polydash
```

Mac project:

```text
/Users/am.will/Applications/polydash
```

The folder name remains `polydash`, but the product/app name is now `OddsPulse`.

## Current Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Convex backend
- Phosphor icons
- Vitest tests
- ESLint
- pnpm package manager

Supabase was removed completely. The current backend target is Convex.

## User-Facing App

The dashboard includes:

- Asymmetric OddsPulse hero/header
- Market count, average heat, and active source summary
- Horizontal market tape
- Platform filters: all, Polymarket, Kalshi
- Category filters: politics, crypto, economics, sports, tech/AI, weather, legal, other
- Search box for market titles
- Hot market list with score, price, 24h volume, spread, close time, and detail links
- Lead signal panel
- Source health panel
- Convex ingest instructions
- Detail page for each market
- Sample fallback data when Convex is not configured

The UI was redesigned using the `design-taste-frontend` skill. It intentionally avoids the original dark generic card-heavy look.

## Backend Model

Convex tables are defined in:

```text
convex/schema.ts
```

Tables:

- `markets`
- `marketSnapshots`
- `trendScores`
- `contextItems`
- `ingestRuns`

Convex functions:

- `convex/markets.ts`
  - `hot`
  - `detail`
  - `previousSnapshots`
  - `saveMarketBatch`
  - `saveContextBatch`
  - `saveTrendScores`
  - `logIngestRun`
- `convex/ingest.ts`
  - `run`
- `convex/crons.ts`
  - schedules market ingestion every 5 minutes

Important note: `convex/_generated/*` currently contains lightweight generated stubs in the Linux copy. Running `pnpm exec convex dev` against a real Convex project will regenerate the real project-specific files.

## Data Sources

Primary market sources:

- Polymarket Gamma/public market API
- Kalshi API, optional credentials required for full use

Optional context sources:

- RSS feeds from `RSS_FEEDS`
- GNews from `GNEWS_API_KEY`
- NewsAPI from `NEWSAPI_KEY`
- Reddit search links; OAuth variables are reserved for future official read-only integration

NewsAPI is intentionally disabled in production unless:

```text
ENABLE_NEWSAPI_IN_PRODUCTION=true
```

## Environment Variables

Template:

```text
.env.example
```

Required for real backend data:

```text
NEXT_PUBLIC_CONVEX_URL=
CRON_SECRET=
```

Optional:

```text
CONVEX_DEPLOY_KEY=
KALSHI_API_KEY_ID=
KALSHI_PRIVATE_KEY=
GNEWS_API_KEY=
NEWSAPI_KEY=
ENABLE_NEWSAPI_IN_PRODUCTION=false
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
RSS_FEEDS=
```

## Setup Steps Remaining

From the project root:

```bash
pnpm install
pnpm exec convex dev
```

After Convex is linked, copy `.env.example` to `.env.local` and fill:

```text
NEXT_PUBLIC_CONVEX_URL
CRON_SECRET
```

Then run:

```bash
pnpm dev
```

To trigger ingestion manually:

```bash
curl -H "authorization: Bearer $CRON_SECRET" http://localhost:3002/api/ingest/run
```

The app will show sample data until Convex is configured and ingestion has run.

## Verification Commands

These passed on the Linux copy after the latest UI work:

```bash
pnpm test
pnpm lint
pnpm build
```

The browser was served at:

```text
http://localhost:3002
```

## Important Files

```text
src/app/page.tsx
src/app/layout.tsx
src/app/globals.css
src/app/markets/[platform]/[id]/page.tsx
src/components/dashboard.tsx
src/components/badge.tsx
src/components/score-ring.tsx
src/lib/repository.ts
src/lib/scoring.ts
src/lib/sources/polymarket.ts
src/lib/sources/kalshi.ts
src/lib/sources/context.ts
src/lib/sources/status.ts
convex/schema.ts
convex/markets.ts
convex/ingest.ts
convex/crons.ts
```

## Design Notes

The latest UI direction:

- Light neutral trading-desk aesthetic
- Single teal accent
- Geist/Satoshi-style sans stack, monospace for numbers
- No emojis
- Phosphor icons only
- CSS-only motion for the market tape and subtle entry states
- `min-h-[100dvh]` instead of `h-screen`
- Mobile collapses to one column

Avoid reverting to:

- Generic dark card dashboards
- Purple/blue AI gradients
- Overly centered hero sections
- Lucide icons
- Supabase references

## Known Limitations

- Convex must be linked on each machine with `pnpm exec convex dev`.
- The app currently has sample fallback data when Convex is not configured.
- Kalshi live data may require free API credentials.
- News/social context is intentionally quota-aware and optional.
- Reddit is currently represented as compliant search links; full official OAuth search can be added later.

