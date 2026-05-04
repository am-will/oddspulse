import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  markets: defineTable({
    marketId: v.string(),
    platform: v.union(v.literal("polymarket"), v.literal("kalshi")),
    externalId: v.string(),
    ticker: v.optional(v.string()),
    title: v.string(),
    category: v.string(),
    url: v.string(),
    status: v.string(),
    closeTime: v.optional(v.string()),
    raw: v.any(),
    updatedAt: v.string(),
  })
    .index("by_market_id", ["marketId"])
    .index("by_platform_external", ["platform", "externalId"])
    .index("by_category", ["category"]),

  marketSnapshots: defineTable({
    marketId: v.string(),
    ts: v.string(),
    price: v.optional(v.number()),
    volume: v.optional(v.number()),
    volume24h: v.optional(v.number()),
    liquidity: v.optional(v.number()),
    spread: v.optional(v.number()),
    openInterest: v.optional(v.number()),
    bestBid: v.optional(v.number()),
    bestAsk: v.optional(v.number()),
    raw: v.any(),
  }).index("by_market_ts", ["marketId", "ts"]),

  trendScores: defineTable({
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
  })
    .index("by_market_id", ["marketId"])
    .index("by_score", ["score"]),

  contextItems: defineTable({
    contextId: v.string(),
    marketId: v.string(),
    source: v.string(),
    title: v.string(),
    url: v.string(),
    publishedAt: v.optional(v.string()),
    matchedKeywords: v.array(v.string()),
    relevanceScore: v.number(),
    raw: v.any(),
    createdAt: v.string(),
  })
    .index("by_context_id", ["contextId"])
    .index("by_market", ["marketId"])
    .index("by_market_relevance", ["marketId", "relevanceScore"]),

  ingestRuns: defineTable({
    source: v.string(),
    status: v.union(v.literal("ok"), v.literal("disabled"), v.literal("error"), v.literal("quota")),
    message: v.string(),
    durationMs: v.number(),
    createdAt: v.string(),
  }).index("by_created", ["createdAt"]),
});
