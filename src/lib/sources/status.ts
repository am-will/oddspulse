import { getOptionalEnv, isProduction } from "../env";
import type { SourceHealth } from "../types";
import { isNewsApiEnabled } from "./context";

export function getSourceHealth(): SourceHealth[] {
  return [
    {
      source: "convex",
      status: getOptionalEnv("NEXT_PUBLIC_CONVEX_URL") ? "ok" : "disabled",
      message: getOptionalEnv("NEXT_PUBLIC_CONVEX_URL") ? "Configured for persistent snapshots" : "Missing NEXT_PUBLIC_CONVEX_URL",
    },
    { source: "polymarket", status: "ok", message: "Public Gamma/CLOB data" },
    {
      source: "kalshi",
      status: getOptionalEnv("KALSHI_API_KEY_ID") && getOptionalEnv("KALSHI_PRIVATE_KEY") ? "ok" : "disabled",
      message: "Kalshi may require free API credentials for authenticated reads",
    },
    {
      source: "gnews",
      status: getOptionalEnv("GNEWS_API_KEY") ? "ok" : "disabled",
      message: getOptionalEnv("GNEWS_API_KEY") ? "Free-tier key configured" : "Missing optional GNEWS_API_KEY",
    },
    {
      source: "newsapi",
      status: isNewsApiEnabled() ? "ok" : "disabled",
      message: getOptionalEnv("NEWSAPI_KEY")
        ? isProduction()
          ? "Disabled in production unless ENABLE_NEWSAPI_IN_PRODUCTION=true"
          : "Developer/free key configured"
        : "Missing optional NEWSAPI_KEY",
    },
    {
      source: "reddit",
      status: getOptionalEnv("REDDIT_CLIENT_ID") && getOptionalEnv("REDDIT_CLIENT_SECRET") ? "ok" : "disabled",
      message: "V1 uses compliant Reddit search links unless OAuth search is enabled later",
    },
    { source: "rss", status: getOptionalEnv("RSS_FEEDS") ? "ok" : "disabled", message: "No-key RSS feed matching" },
  ];
}
