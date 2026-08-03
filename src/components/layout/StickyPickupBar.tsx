import { Link } from "@tanstack/react-router";
import { useActivePickup, STAGE_LABELS } from "@/lib/state/stores";
import { Radio } from "lucide-react";

export function StickyPickupBar() {
  const { current } = useActivePickup();
  if (!current) return null;
  const stage = current.stage;
  return (
    <div className="sticky top-0 z-40 mx-3 mt-3 animate-fade-in rounded-2xl border border-primary/20 bg-gradient-hero p-3 text-primary-foreground shadow-elevated">
      <Link to="/monitoring" className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 animate-pulse-ring">
          <Radio className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">Penjemputan aktif</p>
          <p className="truncate text-sm font-semibold">{STAGE_LABELS[stage]}</p>
        </div>
        <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold">Lihat</span>
      </Link>
    </div>
  );
}
