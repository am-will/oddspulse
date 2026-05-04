import type { Category } from "./types";

const rules: Array<[Category, RegExp]> = [
  ["politics", /election|trump|biden|congress|senate|president|nominee|party|politic|vote/i],
  ["crypto", /bitcoin|btc|ethereum|eth|crypto|solana|token|coin|binance|etf/i],
  ["economics", /fed|rate|inflation|cpi|gdp|jobs|recession|tariff|treasury|market/i],
  ["sports", /nfl|nba|mlb|nhl|soccer|world cup|super bowl|ufc|team|game|championship/i],
  ["tech-ai", /ai|openai|google|apple|nvidia|tesla|model|chip|robot|software/i],
  ["weather", /hurricane|storm|rain|snow|temperature|weather|climate|tornado/i],
  ["legal", /court|supreme|trial|lawsuit|verdict|judge|legal|indict/i],
];

export function categorize(text: string): Category {
  return rules.find(([, rule]) => rule.test(text))?.[0] ?? "other";
}
