# OddsPulse

Free-tier prediction-market radar for Polymarket and Kalshi, backed by Convex with optional news and Reddit context.

## Setup

1. Create/link a Convex project.
2. Copy `.env.example` to `.env.local`.
3. Fill:
   - `NEXT_PUBLIC_CONVEX_URL`
   - `CRON_SECRET`
4. Optional deployment/source keys:
   - `CONVEX_DEPLOY_KEY`
   - `KALSHI_API_KEY_ID`
   - `KALSHI_PRIVATE_KEY`
   - `GNEWS_API_KEY`
   - `NEWSAPI_KEY`
   - `ENABLE_NEWSAPI_IN_PRODUCTION`
   - `REDDIT_CLIENT_ID`
   - `REDDIT_CLIENT_SECRET`
   - `RSS_FEEDS`

## Commands

```bash
pnpm install
pnpm exec convex dev
pnpm dev
pnpm test
pnpm build
```

Run ingestion locally after Convex is configured:

```bash
curl -H "authorization: Bearer $CRON_SECRET" http://localhost:3000/api/ingest/run
```

## Notes

- Source credentials should be set on the Convex deployment for ingestion.
- `CRON_SECRET` should be set on the Next.js host for the ingest endpoint.
- NewsAPI free keys are disabled in production unless `ENABLE_NEWSAPI_IN_PRODUCTION=true`.
- Missing optional keys disable only that source.
- Missing Convex env lets the UI load with sample data, but ingestion will not persist.
