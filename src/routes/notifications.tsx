import { createFileRoute } from "@tanstack/react-router";
import { usePageReady } from "@/hooks/use-page-ready";
import { PageSkeleton } from "@/components/feedback/Skeletons";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { notifications } from "@/lib/dummy/data";
import { IconBadge } from "@/components/common/Section";
import { Bell } from "lucide-react";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifikasi — Panggil" },
      { name: "description", content: "Semua pemberitahuan penjemputan dan sekolah." },
      { property: "og:title", content: "Pusat Notifikasi" },
      { property: "og:description", content: "Belum dibaca dan sudah dibaca." },
    ],
  }),
  component: Notifs,
});

function Notifs() {
  const ready = usePageReady();
  if (!ready) return <PageSkeleton />;
  return (
    <PhoneShell>
      <TopBar title="Notifikasi" back="/dashboard" />
      <div className="space-y-2 p-5">
        {notifications.map((n) => (
          <div key={n.id} className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 shadow-card">
            <IconBadge tone={n.read ? "muted" : "primary"}><Bell className="h-4 w-4" /></IconBadge>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-display text-sm font-bold text-ink">{n.title}</p>
                {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{n.time}</p>
            </div>
          </div>
        ))}
      </div>
      <BottomNav />
    </PhoneShell>
  );
}
