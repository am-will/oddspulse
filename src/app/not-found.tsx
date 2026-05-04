import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative z-10 grid min-h-[100dvh] place-items-center px-6 text-paper">
      <div className="border-y border-[color:var(--color-rule-strong)] py-12 text-center">
        <span className="eyebrow">404 · void</span>
        <h1 className="italic-serif mt-4 text-5xl tracking-[-0.02em]">Page not found.</h1>
        <Link
          href="/"
          className="mt-8 inline-flex font-mono text-[11px] uppercase tracking-[0.22em]"
          style={{ color: "var(--color-amber)", borderBottom: "1px solid var(--color-amber)", paddingBottom: "4px" }}
        >
          Back to the tape
        </Link>
      </div>
    </main>
  );
}
