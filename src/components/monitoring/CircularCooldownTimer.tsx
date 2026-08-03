import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function CircularCooldownTimer({
  startedAt,
  durationMs,
  onDone,
}: {
  startedAt: number;
  durationMs: number;
  onDone?: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);
  const elapsed = Math.min(durationMs, now - startedAt);
  const remaining = Math.max(0, durationMs - elapsed);
  const pct = elapsed / durationMs;
  const r = 68;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);
  const min = Math.floor(remaining / 60000);
  const sec = Math.floor((remaining % 60000) / 1000);

  useEffect(() => {
    if (remaining === 0) onDone?.();
  }, [remaining, onDone]);

  const color = pct < 0.4 ? "stroke-success" : pct < 0.75 ? "stroke-accent" : "stroke-primary";

  return (
    <div className="relative grid h-48 w-48 place-items-center">
      <svg viewBox="0 0 160 160" className="absolute inset-0 h-full w-full -rotate-90">
        <circle cx="80" cy="80" r={r} strokeWidth="10" fill="none" className="stroke-primary/10" />
        <circle
          cx="80"
          cy="80"
          r={r}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className={cn("transition-[stroke-dashoffset] duration-500 ease-linear", color)}
        />
      </svg>
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Bisa memanggil lagi dalam</p>
        <p className="mt-1 font-display text-4xl font-bold text-ink">
          {String(min).padStart(2, "0")}:{String(sec).padStart(2, "0")}
        </p>
      </div>
    </div>
  );
}
