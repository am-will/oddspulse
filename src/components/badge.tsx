import { cn } from "@/lib/utils";

type Tone = "default" | "amber" | "muted";

const tones: Record<Tone, string> = {
  default: "border-[color:var(--color-rule-strong)] text-paper-dim",
  muted: "border-[color:var(--color-rule)] text-paper-mute",
  amber: "border-[color:var(--color-amber)] text-[color:var(--color-amber)]",
};

export function Badge({
  children,
  className,
  tone = "default",
  muted,
}: {
  children: React.ReactNode;
  className?: string;
  tone?: Tone;
  muted?: boolean;
}) {
  const resolved: Tone = muted ? "muted" : tone;
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2 py-[3px] font-mono text-[10px] uppercase tracking-[0.18em]",
        tones[resolved],
        className,
      )}
    >
      {children}
    </span>
  );
}
