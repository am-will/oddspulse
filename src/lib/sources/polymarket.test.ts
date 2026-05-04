import { describe, expect, it } from "vitest";
import { normalizePolymarketMarket } from "./polymarket";

describe("normalizePolymarketMarket", () => {
  it("normalizes Gamma market fields", () => {
    const normalized = normalizePolymarketMarket({
      conditionId: "abc",
      question: "Will Bitcoin close above $100k?",
      slug: "bitcoin-100k",
      active: true,
      volume24hr: "1250",
      liquidity: "5000",
      bestBid: "0.48",
      bestAsk: "0.52",
    });
    expect(normalized?.market.id).toBe("polymarket:abc");
    expect(normalized?.market.category).toBe("crypto");
    expect(normalized?.snapshot.spread).toBeCloseTo(0.04);
  });
});
