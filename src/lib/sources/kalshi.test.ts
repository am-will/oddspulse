import { describe, expect, it } from "vitest";
import { normalizeKalshiMarket } from "./kalshi";

describe("normalizeKalshiMarket", () => {
  it("normalizes cents into probability dollars", () => {
    const normalized = normalizeKalshiMarket({
      ticker: "KXBTC",
      title: "Will Bitcoin rise today?",
      yes_bid: 44,
      yes_ask: 47,
      last_price: 46,
      volume_24h: 1000,
      open_interest: 500,
    });
    expect(normalized?.market.id).toBe("kalshi:KXBTC");
    expect(normalized?.snapshot.price).toBe(0.46);
    expect(normalized?.snapshot.spread).toBeCloseTo(0.03);
  });
});
