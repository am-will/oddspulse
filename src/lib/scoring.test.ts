import { describe, expect, it } from "vitest";
import { computeTrendScore } from "./scoring";
import type { Market, MarketSnapshot } from "./types";

const market: Market = {
  id: "polymarket:1",
  platform: "polymarket",
  externalId: "1",
  title: "Will Bitcoin hit a new high?",
  category: "crypto",
  url: "https://polymarket.com",
  status: "active",
  closeTime: new Date(Date.now() + 48 * 3_600_000).toISOString(),
};

const latest: MarketSnapshot = {
  marketId: market.id,
  ts: new Date().toISOString(),
  price: 0.62,
  volume: 250000,
  volume24h: 100000,
  liquidity: 120000,
  spread: 0.02,
  openInterest: null,
  bestBid: 0.61,
  bestAsk: 0.63,
};

describe("computeTrendScore", () => {
  it("combines market and context signals into a bounded score", () => {
    const score = computeTrendScore({
      market,
      latest,
      previous: { ...latest, price: 0.5, volume: 50000, volume24h: 40000 },
      contexts: [
        {
          id: "ctx",
          marketId: market.id,
          source: "rss",
          title: "Bitcoin traders watch new high",
          url: "https://example.com",
          publishedAt: null,
          matchedKeywords: ["bitcoin", "high"],
          relevanceScore: 0.5,
        },
      ],
    });
    expect(score.score).toBeGreaterThan(40);
    expect(score.score).toBeLessThanOrEqual(100);
    expect(score.why.length).toBeGreaterThan(0);
  });
});
