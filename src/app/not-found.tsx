import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-[100dvh] place-items-center bg-slate-50 p-6 text-slate-950">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_22px_60px_-46px_rgba(15,23,42,0.7)]">
        <h1 className="text-xl font-semibold tracking-tight">Not found</h1>
        <Link href="/" className="mt-5 inline-flex text-sm font-semibold text-teal-700">
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
