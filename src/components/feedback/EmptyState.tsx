import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-surface/50 px-6 py-12 text-center", className)}>
      {icon ? <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">{icon}</div> : null}
      <div>
        <h3 className="font-display text-base font-bold text-ink">{title}</h3>
        {body ? <p className="mt-1 text-sm text-muted-foreground">{body}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-surface-2", className)} />;
}
