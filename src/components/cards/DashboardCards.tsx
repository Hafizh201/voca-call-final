import { announcements, tips, recentPickups } from "@/lib/dummy/data";
import { IconBadge } from "@/components/common/Section";
import { Megaphone, Lightbulb, Clock3, ShieldCheck } from "lucide-react";

export function AnnouncementList() {
  return (
    <div className="space-y-3 px-5">
      {announcements.map((a) => (
        <article key={a.id} className="rounded-3xl border border-border/60 bg-surface p-4 shadow-card">
          <div className="flex items-start gap-3">
            <IconBadge tone="warm">
              <Megaphone className="h-5 w-5" />
            </IconBadge>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent-foreground">{a.tag}</span>
                <span className="text-[10px] text-muted-foreground">{a.time}</span>
              </div>
              <h3 className="mt-1 font-display text-sm font-bold text-ink">{a.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{a.body}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function TipsCard() {
  return (
    <div className="mx-5 rounded-3xl bg-gradient-warm p-5 text-accent-foreground shadow-card">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-5 w-5" />
        <h3 className="font-display text-sm font-bold uppercase tracking-wider">Tips penjemputan</h3>
      </div>
      <ul className="mt-3 space-y-2">
        {tips.map((t, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-foreground" />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RecentPickupsCard() {
  return (
    <div className="mx-5 space-y-2">
      {recentPickups.map((p) => (
        <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-surface px-4 py-3 shadow-card">
          <IconBadge tone="muted"><Clock3 className="h-5 w-5" /></IconBadge>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{p.student} · {p.method}</p>
            <p className="text-[11px] text-muted-foreground">{p.date} · {p.time}</p>
          </div>
          <span className="rounded-full bg-success/15 px-2.5 py-1 text-[10px] font-bold text-success-foreground">{p.status}</span>
        </div>
      ))}
    </div>
  );
}

export function SystemStatusCard() {
  return (
    <div className="mx-5 flex items-center gap-3 rounded-3xl border border-border/60 bg-surface p-4 shadow-card">
      <IconBadge tone="success"><ShieldCheck className="h-5 w-5" /></IconBadge>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-success-foreground">Status sistem</p>
        <p className="text-sm font-semibold text-ink">Seluruh layanan berjalan normal</p>
      </div>
      <span className="grid h-2.5 w-2.5 place-items-center rounded-full bg-success animate-pulse-ring" />
    </div>
  );
}
