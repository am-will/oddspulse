export function formatMoney(value: number | null | undefined) {
  if (value == null) return "n/a";
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function formatPct(value: number | null | undefined) {
  if (value == null) return "n/a";
  return `${Math.round(value * 100)}%`;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "n/a";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric" }).format(new Date(value));
}
