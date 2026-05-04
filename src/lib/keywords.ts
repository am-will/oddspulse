const stopWords = new Set([
  "will",
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "market",
  "before",
  "after",
  "have",
  "over",
  "under",
  "than",
  "what",
  "when",
  "where",
  "does",
  "2026",
  "2027",
  "2028",
]);

export function extractKeywords(title: string, limit = 6) {
  return Array.from(
    new Set(
      title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length > 2 && !stopWords.has(word)),
    ),
  ).slice(0, limit);
}

export function scoreContextMatch(title: string, keywords: string[]) {
  const lower = title.toLowerCase();
  const matches = keywords.filter((keyword) => lower.includes(keyword.toLowerCase()));
  return {
    matchedKeywords: matches,
    relevanceScore: keywords.length === 0 ? 0 : matches.length / keywords.length,
  };
}
