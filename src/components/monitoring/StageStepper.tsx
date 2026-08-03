import { STAGE_ORDER, STAGE_LABELS, type PickupStage, type TimelineEntry } from "@/lib/state/stores";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function StageStepper({ stage }: { stage: PickupStage }) {
  const currentIdx = STAGE_ORDER.indexOf(stage);
  return (
    <ol className="space-y-3">
      {STAGE_ORDER.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <li key={s} className="flex items-center gap-3">
            <div
              className={cn(
                "grid h-9 w-9 shrink-0 place-items-center rounded-xl transition",
                done && "bg-success/15 text-success-foreground",
                active && "bg-primary text-primary-foreground animate-pulse-ring",
                !done && !active && "bg-surface-2 text-muted-foreground",
              )}
            >
              {done ? <Check className="h-4 w-4 animate-stage-tick" /> : active ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="text-xs">{i + 1}</span>}
            </div>
            <span className={cn("text-sm", (done || active) ? "font-semibold text-ink" : "text-muted-foreground")}>
              {STAGE_LABELS[s]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function ProgressRing({ stage }: { stage: PickupStage }) {
  const idx = STAGE_ORDER.indexOf(stage);
  const pct = ((idx + 1) / STAGE_ORDER.length) * 100;
  const r = 42;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative grid h-28 w-28 place-items-center">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} strokeWidth="7" fill="none" className="stroke-primary/15" />
        <circle
          cx="50"
          cy="50"
          r={r}
          strokeWidth="7"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="stroke-primary transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="text-center">
        <p className="font-display text-2xl font-bold text-ink">{Math.round(pct)}%</p>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Proses</p>
      </div>
    </div>
  );
}

export function ActivityTimeline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <ol className="relative space-y-3 border-l-2 border-dashed border-border pl-4">
      {entries.map((e, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[22px] grid h-4 w-4 place-items-center rounded-full bg-primary text-white">
            <Check className="h-2.5 w-2.5" />
          </span>
          <p className="text-sm font-semibold text-ink">{e.label}</p>
          <p className="text-[11px] text-muted-foreground">{e.at}</p>
        </li>
      ))}
    </ol>
  );
}
