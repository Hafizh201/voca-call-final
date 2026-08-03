import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionHeader({
  title,
  action,
  className,
}: {
  title: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-center justify-between px-5", className)}>
      <h2 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">{title}</h2>
      {action}
    </div>
  );
}

export function Chip({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "primary" | "danger";
  className?: string;
}) {
  const tones = {
    neutral: "bg-surface-2 text-foreground",
    success: "bg-success/15 text-success-foreground",
    warning: "bg-warning/20 text-warning-foreground",
    primary: "bg-primary/10 text-primary",
    danger: "bg-destructive/10 text-destructive",
  } as const;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold", tones[tone], className)}>
      {children}
    </span>
  );
}

export function IconBadge({ children, tone = "primary" }: { children: ReactNode; tone?: "primary" | "warm" | "success" | "muted" }) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    warm: "bg-accent/25 text-accent-foreground",
    success: "bg-success/15 text-success-foreground",
    muted: "bg-surface-2 text-muted-foreground",
  } as const;
  return <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-2xl", tones[tone])}>{children}</span>;
}
