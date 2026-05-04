import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const nullableNumber = v.union(v.number(), v.null());
const nullableString = v.union(v.string(), v.null());

const marketArg = v.object({
  id: v.string(),
  platform: v.union(v.literal("polymarket"), v.literal("kalshi")),
  externalId: v.string(),
  ticker: v.optional(nullableString),
  title: v.string(),
  category: v.string(),
  url: v.string(),
  status: v.string(),
  closeTime: v.optional(nullableString),
  raw: v.optional(v.any()),
});

const snapshotArg = v.object({
  marketId: v.string(),
  ts: v.string(),
  price: nullableNumber,
  volume: nullableNumber,
  volume24h: nullableNumber,
  liquidity: nullableNumber,
  spread: nullableNumber,
  openInterest: nullableNumber,
  bestBid: nullableNumber,
  bestAsk: nullableNumber,
  raw: v.optional(v.any()),
});

const contextArg = v.object({
  id: v.string(),
  marketId: v.string(),
  source: v.string(),
  title: v.string(),
  url: v.string(),
  publishedAt: nullableString,
  matchedKeywords: v.array(v.string()),
  relevanceScore: v.number(),
  raw: v.optional(v.any()),
});

const trendArg = v.object({
  marketId: v.string(),
  score: v.number(),
  volumeScore: v.number(),
  priceScore: v.number(),
  liquidityScore: v.number(),
  openInterestScore: v.number(),
  contextScore: v.number(),
  recencyScore: v.number(),
  why: v.array(v.string()),
  computedAt: v.string(),
});

function cleanOptionalNumber(value: number | null) {
  return value == null ? undefined : value;
}

function cleanOptionalString(value: string | null | undefined) {
  return value == null ? undefined : value;
}

export const saveMarketBatch = mutation({
  args: {
    records: v.array(v.object({ market: marketArg, snapshot: snapshotArg })),
  },
  handler: async (ctx, { records }) => {
    for (const { market, snapshot } of records) {
      const existing = await ctx.db
        .query("markets")
        .withIndex("by_market_id", (q) => q.eq("marketId", market.id))
        .unique();
      const payload = {
        marketId: market.id,
        platform: market.platform,
        externalId: market.externalId,
        ticker: cleanOptionalString(market.ticker),
        title: market.title,
        category: market.category,
        url: market.url,
        status: market.status,
        closeTime: cleanOptionalString(market.closeTime),
        raw: market.raw ?? {},
        updatedAt: new Date().toISOString(),
      };
      if (existing) await ctx.db.patch(existing._id, payload);
      else await ctx.db.insert("markets", payload);

      await ctx.db.insert("marketSnapshots", {
        marketId: snapshot.marketId,
        ts: snapshot.ts,
        price: cleanOptionalNumber(snapshot.price),
        volume: cleanOptionalNumber(snapshot.volume),
        volume24h: cleanOptionalNumber(snapshot.volume24h),
        liquidity: cleanOptionalNumber(snapshot.liquidity),
        spread: cleanOptionalNumber(snapshot.spread),
        openInterest: cleanOptionalNumber(snapshot.openInterest),
        bestBid: cleanOptionalNumber(snapshot.bestBid),
        bestAsk: cleanOptionalNumber(snapshot.bestAsk),
        raw: snapshot.raw ?? {},
      });
    }
  },
});

export const saveContextBatch = mutation({
  args: { items: v.array(contextArg) },
  handler: async (ctx, { items }) => {
    for (const item of items) {
      const existing = await ctx.db
        .query("contextItems")
        .withIndex("by_context_id", (q) => q.eq("contextId", item.id))
        .unique();
      const payload = {
        contextId: item.id,
        marketId: item.marketId,
        source: item.source,
        title: item.title,
        url: item.url,
        publishedAt: cleanOptionalString(item.publishedAt),
        matchedKeywords: item.matchedKeywords,
        relevanceScore: item.relevanceScore,
        raw: item.raw ?? {},
        createdAt: new Date().toISOString(),
      };
      if (existing) await ctx.db.patch(existing._id, payload);
      else await ctx.db.insert("contextItems", payload);
    }
  },
});

export const saveTrendScores = mutation({
  args: { scores: v.array(trendArg) },
  handler: async (ctx, { scores }) => {
    for (const score of scores) {
      const existing = await ctx.db
        .query("trendScores")
        .withIndex("by_market_id", (q) => q.eq("marketId", score.marketId))
        .unique();
      if (existing) await ctx.db.patch(existing._id, score);
      else await ctx.db.insert("trendScores", score);
    }
  },
});

export const logIngestRun = mutation({
  args: {
    source: v.string(),
    status: v.union(v.literal("ok"), v.literal("disabled"), v.literal("error"), v.literal("quota")),
    message: v.string(),
    durationMs: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("ingestRuns", { ...args, createdAt: new Date().toISOString() });
  },
});

export const sourceHealth = query({
  args: {},
  handler: async () => {
    const has = (name: string) => Boolean(process.env[name]?.trim());
    const newsApiEnabled = has("NEWSAPI_KEY") && (process.env.NODE_ENV !== "production" || process.env.ENABLE_NEWSAPI_IN_PRODUCTION === "true");

    return [
      {
        source: "convex",
        status: "ok",
        message: "Configured for persistent snapshots",
      },
      { source: "polymarket", status: "ok", message: "Public Gamma/CLOB data" },
      {
        source: "kalshi",
        status: has("KALSHI_API_KEY_ID") && has("KALSHI_PRIVATE_KEY") ? "ok" : "disabled",
        message: has("KALSHI_API_KEY_ID") && has("KALSHI_PRIVATE_KEY") ? "Kalshi credentials configured" : "Kalshi may require free API credentials for authenticated reads",
      },
      {
        source: "gnews",
        status: has("GNEWS_API_KEY") ? "ok" : "disabled",
        message: has("GNEWS_API_KEY") ? "Free-tier key configured" : "Missing optional GNEWS_API_KEY",
      },
      {
        source: "newsapi",
        status: newsApiEnabled ? "ok" : "disabled",
        message: has("NEWSAPI_KEY")
          ? process.env.NODE_ENV === "production" && process.env.ENABLE_NEWSAPI_IN_PRODUCTION !== "true"
            ? "Disabled in production unless ENABLE_NEWSAPI_IN_PRODUCTION=true"
            : "Developer/free key configured"
          : "Missing optional NEWSAPI_KEY",
      },
      {
        source: "reddit",
        status: has("REDDIT_CLIENT_ID") && has("REDDIT_CLIENT_SECRET") ? "ok" : "disabled",
        message: has("REDDIT_CLIENT_ID") && has("REDDIT_CLIENT_SECRET") ? "OAuth credentials configured" : "V1 uses compliant Reddit search links unless OAuth search is enabled later",
      },
      {
        source: "rss",
        status: has("RSS_FEEDS") ? "ok" : "disabled",
        message: has("RSS_FEEDS") ? "RSS feeds configured" : "Missing optional RSS_FEEDS",
      },
    ];
  },
});

export const previousSnapshots = query({
  args: { marketIds: v.array(v.string()) },
  handler: async (ctx, { marketIds }) => {
    const snapshots = [];
    for (const marketId of marketIds) {
      const [snapshot] = await ctx.db
        .query("marketSnapshots")
        .withIndex("by_market_ts", (q) => q.eq("marketId", marketId))
        .order("desc")
        .take(1);
      if (snapshot) snapshots.push(snapshot);
    }
    return snapshots;
  },
});

export const hot = query({
  args: {
    limit: v.optional(v.number()),
    platform: v.optional(v.string()),
    category: v.optional(v.string()),
    query: v.optional(v.string()),
  },
  handler: async (ctx, { limit, platform, category, query }) => {
    const requestedLimit = limit ?? 50;
    const hasFilters = Boolean(platform || category || query?.trim());
    const scores = await ctx.db
      .query("trendScores")
      .withIndex("by_score")
      .order("desc")
      .take(hasFilters ? Math.max(requestedLimit * 8, 500) : requestedLimit);
    const normalizedQuery = query?.trim().toLowerCase();
    const markets = [];
    for (const score of scores) {
      const market = await ctx.db
        .query("markets")
        .withIndex("by_market_id", (q) => q.eq("marketId", score.marketId))
        .unique();
      if (!market) continue;
      if (platform && market.platform !== platform) continue;
      if (category && market.category !== category) continue;
      if (normalizedQuery && !market.title.toLowerCase().includes(normalizedQuery)) continue;
      const [snapshot] = await ctx.db
        .query("marketSnapshots")
        .withIndex("by_market_ts", (q) => q.eq("marketId", score.marketId))
        .order("desc")
        .take(1);
      const contexts = await ctx.db
        .query("contextItems")
        .withIndex("by_market", (q) => q.eq("marketId", score.marketId))
        .take(5);
      markets.push({ market, snapshot: snapshot ?? null, trend: score, contextItems: contexts });
      if (markets.length >= requestedLimit) break;
    }
    return markets;
  },
});

export const detail = query({
  args: {
    platform: v.string(),
    externalId: v.string(),
  },
  handler: async (ctx, { platform, externalId }) => {
    const market = await ctx.db
      .query("markets")
      .withIndex("by_market_id", (q) => q.eq("marketId", `${platform}:${externalId}`))
      .unique();
    if (!market) return null;
    const snapshots = await ctx.db
      .query("marketSnapshots")
      .withIndex("by_market_ts", (q) => q.eq("marketId", market.marketId))
      .order("desc")
      .take(48);
    const trend = await ctx.db
      .query("trendScores")
      .withIndex("by_market_id", (q) => q.eq("marketId", market.marketId))
      .unique();
    const contextItems = await ctx.db
      .query("contextItems")
      .withIndex("by_market", (q) => q.eq("marketId", market.marketId))
      .take(12);
    return { market, snapshots, trend, contextItems };
  },
});
