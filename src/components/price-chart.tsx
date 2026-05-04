"use client";

import { useMemo, useRef, useState } from "react";
import type { PricePoint, Range } from "@/lib/sources/polymarket-history";

const RANGES: Array<{ key: Range; label: string }> = [
  { key: "1d", label: "1D" },
  { key: "1w", label: "1W" },
  { key: "1m", label: "1M" },
  { key: "max", label: "ALL" },
];

const W = 1000;
const H = 240;
const PAD_T = 18;
const PAD_B = 28;
const PAD_X = 0;
const innerH = H - PAD_T - PAD_B;
const innerW = W - PAD_X * 2;

export function PriceChart({
  points,
  range = "max",
  basePath,
}: {
  points: PricePoint[];
  range?: Range;
  basePath: string;
}) {
  if (points.length < 2) {
    return (
      <ChartFrame range={range} basePath={basePath}>
        <div className="grid h-[240px] place-items-center font-mono text-[11px] uppercase tracking-[0.22em] text-paper-mute">
          ⌀ insufficient price history
        </div>
      </ChartFrame>
    );
  }

  return <InteractiveChart points={points} range={range} basePath={basePath} />;
}

function InteractiveChart({
  points,
  range,
  basePath,
}: {
  points: PricePoint[];
  range: Range;
  basePath: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  // domains
  const { tMin, tMax, x, y, coords, path, area } = useMemo(() => {
    const ts = points.map((p) => p.t);
    const tMin = Math.min(...ts);
    const tMax = Math.max(...ts);
    const dt = tMax - tMin || 1;
    const x = (t: number) => PAD_X + ((t - tMin) / dt) * innerW;
    const y = (p: number) => PAD_T + (1 - p) * innerH; // p in [0,1]
    const coords = points.map((pt) => ({ t: pt.t, p: pt.p, vx: x(pt.t), vy: y(pt.p) }));
    const path = coords
      .map((c, i) => `${i === 0 ? "M" : "L"} ${c.vx.toFixed(2)} ${c.vy.toFixed(2)}`)
      .join(" ");
    const last = coords[coords.length - 1];
    const first = coords[0];
    const area = `${path} L ${last.vx.toFixed(2)} ${PAD_T + innerH} L ${first.vx.toFixed(2)} ${
      PAD_T + innerH
    } Z`;
    return { tMin, tMax, x, y, coords, path, area };
  }, [points]);

  const last = coords[coords.length - 1];
  const first = coords[0];
  const delta = last.p - first.p;
  const deltaPct = first.p > 0 ? (delta / first.p) * 100 : 0;
  const up = delta >= 0;

  const fmtDate = (unix: number) =>
    new Date(unix * 1000).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const fmtTooltipDate = (unix: number) =>
    new Date(unix * 1000).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  const fmtTooltipTime = (unix: number) =>
    new Date(unix * 1000).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  const updateHover = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0) return;
    const vbx = ((clientX - rect.left) / rect.width) * W;
    // nearest neighbour by viewbox-x
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < coords.length; i++) {
      const d = Math.abs(coords[i].vx - vbx);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    setHoverIdx(best);
  };

  const hover = hoverIdx != null ? coords[hoverIdx] : null;
  const hoverLeftPct = hover ? (hover.vx / W) * 100 : 0;
  const flipLeft = hoverLeftPct > 62;

  return (
    <ChartFrame
      range={range}
      basePath={basePath}
      headline={hover ?? last}
      delta={deltaPct}
      up={up}
      hovering={hover != null}
    >
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          role="img"
          aria-label="Price history"
          className="block h-[240px] w-full touch-none select-none"
          onMouseMove={(e) => updateHover(e.clientX)}
          onMouseLeave={() => setHoverIdx(null)}
          onTouchStart={(e) => {
            if (e.touches[0]) updateHover(e.touches[0].clientX);
          }}
          onTouchMove={(e) => {
            if (e.touches[0]) updateHover(e.touches[0].clientX);
          }}
          onTouchEnd={() => setHoverIdx(null)}
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

          {/* area + line */}
          <path d={area} fill="url(#pc-area)" />
          <path
            d={path}
            fill="none"
            stroke="var(--color-amber)"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />

          {/* last price marker (only when not hovering) */}
          {hover == null ? (
            <>
              <circle cx={last.vx} cy={last.vy} r={3.5} fill="var(--color-amber)" />
              <circle
                cx={last.vx}
                cy={last.vy}
                r={9}
                fill="none"
                stroke="var(--color-amber)"
                strokeOpacity={0.35}
                strokeWidth={1}
              />
            </>
          ) : null}

          {/* y-axis labels */}
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
              {(tick * 100).toFixed(0)}%
            </text>
          ))}

          {/* x-axis labels (hidden when hovering to avoid clutter) */}
          {hover == null ? (
            <>
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
            </>
          ) : null}

          {/* crosshair */}
          {hover ? (
            <>
              <line
                x1={hover.vx}
                x2={hover.vx}
                y1={PAD_T}
                y2={H - PAD_B}
                stroke="var(--color-paper)"
                strokeOpacity={0.45}
                strokeDasharray="2 4"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
              <circle cx={hover.vx} cy={hover.vy} r={5} fill="var(--color-amber)" />
              <circle
                cx={hover.vx}
                cy={hover.vy}
                r={5}
                fill="none"
                stroke="var(--color-ink)"
                strokeWidth={2}
              />
            </>
          ) : null}
        </svg>

        {/* HTML tooltip overlay (positioned in % so it scales with svg width) */}
        {hover ? (
          <div
            className="pointer-events-none absolute"
            style={{
              left: `${hoverLeftPct}%`,
              top: `${hover.vy}px`,
              transform: `translate(${flipLeft ? "calc(-100% - 12px)" : "12px"}, calc(-100% - 8px))`,
            }}
          >
            <div
              className="font-mono whitespace-nowrap"
              style={{
                background: "var(--color-ink-2)",
                border: "1px solid var(--color-amber)",
                padding: "8px 10px",
                boxShadow: "0 18px 40px -22px rgba(0,0,0,0.85)",
              }}
            >
              <div
                className="text-[10px] uppercase tabular"
                style={{ color: "var(--color-paper-mute)", letterSpacing: "0.2em" }}
              >
                {fmtTooltipDate(hover.t)} · {fmtTooltipTime(hover.t)}
              </div>
              <div
                className="mt-1 text-[20px] tabular leading-none"
                style={{ color: "var(--color-amber)" }}
              >
                {(hover.p * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </ChartFrame>
  );
}

function ChartFrame({
  children,
  range,
  basePath,
  headline,
  delta,
  up,
  hovering,
}: {
  children: React.ReactNode;
  range: Range;
  basePath: string;
  headline?: { p: number };
  delta?: number;
  up?: boolean;
  hovering?: boolean;
}) {
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4 border-t border-[color:var(--color-rule-strong)] pt-4">
        <div className="flex items-baseline gap-4">
          <span className="eyebrow">{hovering ? "Hovering" : "Price history"}</span>
          {headline ? (
            <>
              <span className="font-mono text-[28px] leading-none tabular text-paper">
                {(headline.p * 100).toFixed(1)}%
              </span>
              {!hovering && typeof delta === "number" ? (
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
