import crypto from "node:crypto";
import Parser from "rss-parser";
import { getOptionalEnv, isProduction } from "../env";
import { extractKeywords, scoreContextMatch } from "../keywords";
import type { ContextItem, Market } from "../types";

type Article = { title?: string; url?: string; publishedAt?: string; published_at?: string; link?: string; isoDate?: string };

const RSS_FEED_LIMIT = 12;

function itemId(source: string, marketId: string, url: string) {
  return crypto.createHash("sha1").update(`${source}:${marketId}:${url}`).digest("hex");
}

function sanitizeConvexValue(value: unknown): unknown {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map((item) => sanitizeConvexValue(item) ?? null);
  if (typeof value !== "object") return null;

  const sanitized: Record<string, unknown> = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    if (key.startsWith("$")) continue;
    const nextValue = sanitizeConvexValue(nestedValue);
    if (nextValue !== null) sanitized[key] = nextValue;
  }
  return sanitized;
}

function toContext(source: string, market: Market, article: Article): ContextItem | null {
  const title = article.title;
  const url = article.url ?? article.link;
  if (!title || !url) return null;
  const keywords = extractKeywords(market.title);
  const match = scoreContextMatch(title, keywords);
  return {
    id: itemId(source, market.id, url),
    marketId: market.id,
    source,
    title,
    url,
    publishedAt: article.publishedAt ?? article.published_at ?? article.isoDate ?? null,
    matchedKeywords: match.matchedKeywords,
    relevanceScore: match.relevanceScore,
    raw: sanitizeConvexValue(article),
  };
}

export function isNewsApiEnabled() {
  if (!getOptionalEnv("NEWSAPI_KEY")) return false;
  return !isProduction() || process.env.ENABLE_NEWSAPI_IN_PRODUCTION === "true";
}

export async function fetchGNewsContext(market: Market) {
  const key = getOptionalEnv("GNEWS_API_KEY");
  if (!key) return [];
  const query = encodeURIComponent(extractKeywords(market.title, 4).join(" "));
  const url = `https://gnews.io/api/v4/search?q=${query}&lang=en&country=us&max=5&apikey=${key}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`GNews ${response.status}`);
  const data = (await response.json()) as { articles?: Article[] };
  return (data.articles ?? []).map((article) => toContext("gnews", market, article)).filter(Boolean) as ContextItem[];
}

export async function fetchNewsApiContext(market: Market) {
  const key = getOptionalEnv("NEWSAPI_KEY");
  if (!key || !isNewsApiEnabled()) return [];
  const query = encodeURIComponent(extractKeywords(market.title, 4).join(" "));
  const from = new Date(Date.now() - 3 * 86_400_000).toISOString().slice(0, 10);
  const url = `https://newsapi.org/v2/everything?q=${query}&from=${from}&sortBy=publishedAt&pageSize=5&apiKey=${key}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`NewsAPI ${response.status}`);
  const data = (await response.json()) as { articles?: Article[] };
  return (data.articles ?? []).map((article) => toContext("newsapi", market, article)).filter(Boolean) as ContextItem[];
}

export async function fetchRssContext(market: Market) {
  const feeds = (getOptionalEnv("RSS_FEEDS") ?? "")
    .split(",")
    .map((feed) => feed.trim())
    .filter(Boolean)
    .slice(0, RSS_FEED_LIMIT);
  if (!feeds.length) return [];
  const parser = new Parser();
  const keywords = extractKeywords(market.title, 4);
  const items: ContextItem[] = [];
  for (const feed of feeds) {
    try {
      const parsed = await parser.parseURL(feed);
      for (const item of parsed.items.slice(0, 20)) {
        const context = toContext("rss", market, item as Article);
        if (context && scoreContextMatch(context.title, keywords).matchedKeywords.length > 0) items.push(context);
      }
    } catch {
      continue;
    }
  }
  return items.slice(0, 8);
}

export function redditSearchLinks(market: Market) {
  const query = encodeURIComponent(extractKeywords(market.title, 5).join(" "));
  return [
    {
      id: itemId("reddit-link", market.id, query),
      marketId: market.id,
      source: "reddit-link",
      title: `Search Reddit for "${extractKeywords(market.title, 5).join(" ")}"`,
      url: `https://www.reddit.com/search/?q=${query}&sort=new`,
      publishedAt: null,
      matchedKeywords: extractKeywords(market.title, 5),
      relevanceScore: 0.25,
    },
  ] satisfies ContextItem[];
}

export async function fetchContextItems(market: Market) {
  const settled = await Promise.allSettled([
    fetchGNewsContext(market),
    fetchNewsApiContext(market),
    fetchRssContext(market),
  ]);
  return settled.flatMap((result) => (result.status === "fulfilled" ? result.value : [])).concat(redditSearchLinks(market));
}
