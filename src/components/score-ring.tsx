export function ScoreRing({ score }: { score: number }) {
  const value = Math.max(0, Math.min(100, score));
  return (
    <div
      className="grid size-16 place-items-center rounded-full text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
      style={{ background: `conic-gradient(#0f766e ${value * 3.6}deg, #e2e8f0 0deg)` }}
    >
      <div className="grid size-12 place-items-center rounded-full bg-white font-mono text-slate-950 shadow-[0_14px_35px_-24px_rgba(15,23,42,0.8)]">{Math.round(value)}</div>
    </div>
  );
}
