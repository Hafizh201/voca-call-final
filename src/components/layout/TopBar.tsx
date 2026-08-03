import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

export function TopBar({
  title,
  subtitle,
  back,
  right,
}: {
  title?: string;
  subtitle?: string;
  back?: string | true;
  right?: ReactNode;
}) {
  return (
    <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border/40 bg-background/85 px-5 py-4 backdrop-blur">
      {back ? (
        <Link
          to={typeof back === "string" ? back : "/dashboard"}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-surface-2 text-foreground shadow-card active:scale-95"
          aria-label="Kembali"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
      ) : null}
      <div className="min-w-0 flex-1">
        {title ? <h1 className="truncate font-display text-lg font-bold text-ink">{title}</h1> : null}
        {subtitle ? <p className="truncate text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}
