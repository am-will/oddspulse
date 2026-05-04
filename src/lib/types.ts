export type Platform = "polymarket" | "kalshi";

export type Category =
  | "politics"
  | "crypto"
  | "economics"
  | "sports"
  | "tech-ai"
  | "weather"
  | "legal"
  | "other";

export type SourceStatus = "ok" | "disabled" | "error" | "quota";

export type Market = {
  id: string;
  platform: Platform;
  externalId: string;
  ticker?: string | null;
  title: string;
  category: Category;
  url: string;
  status: string;
  closeTime?: string | null;
  raw?: unknown;
};

export type MarketSnapshot = {
  marketId: string;
  ts: string;
  price: number | null;
  volume: number | null;
  volume24h: number | null;
  liquidity: number | null;
  spread: number | null;
  openInterest: number | null;
  bestBid: number | null;
  bestAsk: number | null;
  raw?: unknown;
};

export type ContextItem = {
  id: string;
  marketId: string;
  source: string;
  title: string;
  url: string;
  publishedAt: string | null;
  matchedKeywords: string[];
  relevanceScore: number;
  raw?: unknown;
};

export type TrendScore = {
  marketId: string;
  score: number;
  volumeScore: number;
  priceScore: number;
  liquidityScore: number;
  openInterestScore: number;
  contextScore: number;
  recencyScore: number;
  why: string[];
  computedAt: string;
};

export type HotMarket = Market & {
  snapshot: MarketSnapshot | null;
  trend: TrendScore | null;
  contextItems: ContextItem[];
};

export type SourceHealth = {
  source: string;
  status: SourceStatus;
  message: string;
};
