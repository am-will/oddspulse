export function ScoreRing({ score }: { score: number }) {
  const value = Math.max(0, Math.min(100, score));
  return (
    <div className="grid gap-2">
      <div
        className="score-glyph text-[64px]"
        style={{ color: value >= 70 ? "var(--color-amber)" : "var(--color-paper)" }}
      >
        {String(Math.round(value)).padStart(2, "0")}
      </div>
      <HeatBar score={value} />
    </div>
  );
}

export function HeatBar({ score }: { score: number }) {
  const value = Math.max(0, Math.min(100, score));
  return (
    <div className="grid gap-1.5" aria-label={`Heat score ${Math.round(value)} of 100`}>
      <div
        className="relative h-[3px] w-full overflow-hidden"
        style={{ background: "var(--color-rule)" }}
      >
        <div
          className="heat-fill absolute inset-y-0 left-0"
          style={{ width: `${value}%` }}
        />
      </div>
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-paper-mute">
        <span>00</span>
        <span className="tabular">heat · {Math.round(value)}</span>
        <span>100</span>
      </div>
    </div>
  );
}
