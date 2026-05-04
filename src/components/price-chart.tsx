import type { PricePoint, Range } from "@/lib/sources/polymarket-history";

const RANGES: Array<{ key: Range; label: string }> = [
  { key: "1d", label: "1D" },
  { key: "1w", label: "1W" },
  { key: "1m", label: "1M" },
  { key: "max", label: "ALL" },
];

export function PriceChart({
  points,
  range = "max",
  basePath,
}: {
  points: PricePoint[];
  range?: Range;
  /** route to use when switching ranges, e.g. /markets/polymarket/0xabc */
  basePath: string;
}) {
  const W = 1000;
  const H = 240;
  const PAD_T = 18;
  const PAD_B = 28;
  const PAD_X = 0;
  const innerH = H - PAD_T - PAD_B;
  const innerW = W - PAD_X * 2;

  if (points.length < 2) {
    return (
      <ChartFrame range={range} basePath={basePath}>
        <div className="grid h-[240px] place-items-center font-mono text-[11px] uppercase tracking-[0.22em] text-paper-mute">
          ⌀ insufficient price history
        </div>
      </ChartFrame>
    );
  }

  // domains
  const ts = points.map((p) => p.t);
  const tMin = Math.min(...ts);
  const tMax = Math.max(...ts);
  const dt = tMax - tMin || 1;
  const yMin = 0;
  const yMax = 1;

  const x = (t: number) => PAD_X + ((t - tMin) / dt) * innerW;
  const y = (p: number) => PAD_T + (1 - (p - yMin) / (yMax - yMin)) * innerH;

  const path = points
    .map((pt, i) => `${i === 0 ? "M" : "L"} ${x(pt.t).toFixed(2)} ${y(pt.p).toFixed(2)}`)
    .join(" ");
  const area = `${path} L ${x(tMax).toFixed(2)} ${PAD_T + innerH} L ${x(tMin).toFixed(2)} ${
    PAD_T + innerH
  } Z`;

  const last = points[points.length - 1];
  const first = points[0];
  const delta = last.p - first.p;
  const deltaPct = first.p > 0 ? (delta / first.p) * 100 : 0;
  const up = delta >= 0;

  const fmtDate = (unix: number) =>
    new Date(unix * 1000).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const fmtPct = (p: number) => `${(p * 100).toFixed(0)}%`;

  // y-axis ticks: 0, 25, 50, 75, 100
  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <ChartFrame range={range} basePath={basePath} last={last.p} delta={deltaPct} up={up}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Price history"
        className="block h-[240px] w-full"
      >
        <defs>
          <linearGradient id="pc-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-amber)" stopOpacity="0.36" />
            <stop offset="55%" stopColor="var(--color-amber)" stopOpacity="0.10" />
            <stop offset="100%" stopColor="var(--color-amber)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* gridlines */}
        {yTicks.map((tick) => (
          <line
            key={tick}
            x1={0}
            x2={W}
            y1={y(tick)}
            y2={y(tick)}
            stroke="var(--color-rule)"
            strokeWidth={1}
            shapeRendering="crispEdges"
          />
        ))}

        {/* area */}
        <path d={area} fill="url(#pc-area)" />
        {/* line */}
        <path
          d={path}
          fill="none"
          stroke="var(--color-amber)"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* last price marker */}
        <circle cx={x(last.t)} cy={y(last.p)} r={3.5} fill="var(--color-amber)" />
        <circle
          cx={x(last.t)}
          cy={y(last.p)}
          r={9}
          fill="none"
          stroke="var(--color-amber)"
          strokeOpacity={0.35}
          strokeWidth={1}
        />

        {/* y-axis labels (right side) */}
        {yTicks.map((tick) => (
          <text
            key={`lbl-${tick}`}
            x={W - 6}
            y={y(tick) - 4}
            textAnchor="end"
            fontSize="10"
            fontFamily="var(--font-mono)"
            fill="var(--color-paper-mute)"
            style={{ letterSpacing: "0.18em" }}
          >
            {fmtPct(tick)}
          </text>
        ))}

        {/* x-axis date labels */}
        <text
          x={4}
          y={H - 8}
          fontSize="10"
          fontFamily="var(--font-mono)"
          fill="var(--color-paper-mute)"
          style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
        >
          {fmtDate(tMin)}
        </text>
        <text
          x={W - 6}
          y={H - 8}
          textAnchor="end"
          fontSize="10"
          fontFamily="var(--font-mono)"
          fill="var(--color-paper-mute)"
          style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
        >
          {fmtDate(tMax)}
        </text>
      </svg>
    </ChartFrame>
  );
}

function ChartFrame({
  children,
  range,
  basePath,
  last,
  delta,
  up,
}: {
  children: React.ReactNode;
  range: Range;
  basePath: string;
  last?: number;
  delta?: number;
  up?: boolean;
}) {
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4 border-t border-[color:var(--color-rule-strong)] pt-4">
        <div className="flex items-baseline gap-4">
          <span className="eyebrow">Price history</span>
          {typeof last === "number" ? (
            <>
              <span className="font-mono text-[28px] leading-none tabular text-paper">
                {(last * 100).toFixed(1)}%
              </span>
              {typeof delta === "number" ? (
                <span
                  className="font-mono text-[12px] tabular"
                  style={{ color: up ? "var(--color-amber)" : "var(--color-cool)" }}
                >
                  {up ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%
                </span>
              ) : null}
            </>
          ) : null}
        </div>
        <nav className="flex gap-1">
          {RANGES.map((r) => {
            const active = r.key === range;
            const href = r.key === "max" ? basePath : `${basePath}?range=${r.key}`;
            return (
              <a
                key={r.key}
                href={href}
                className="font-mono text-[10.5px] uppercase tracking-[0.22em]"
                style={{
                  padding: "5px 10px",
                  border: "1px solid var(--color-rule-strong)",
                  color: active ? "var(--color-ink)" : "var(--color-paper-dim)",
                  background: active ? "var(--color-amber)" : "transparent",
                  borderColor: active ? "var(--color-amber)" : "var(--color-rule-strong)",
                }}
              >
                {r.label}
              </a>
            );
          })}
        </nav>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
