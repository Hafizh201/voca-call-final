import { createFileRoute } from "@tanstack/react-router";
import { usePageReady } from "@/hooks/use-page-ready";
import { PageSkeleton } from "@/components/feedback/Skeletons";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { notifications as seedNotifications } from "@/lib/dummy/data";
import { IconBadge } from "@/components/common/Section";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
  const [items, setItems] = useState(seedNotifications.map((n) => ({ ...n })));
  if (!ready) return <PageSkeleton />;

  const unread = items.filter((n) => !n.read).length;

  return (
    <PhoneShell>
      <TopBar title="Notifikasi" back="/dashboard" subtitle={unread > 0 ? `${unread} belum dibaca` : "Semua sudah dibaca"} />
      <div className="space-y-2 p-5">
        {items.length > 0 && (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={unread === 0}
              onClick={() => {
                setItems((p) => p.map((n) => ({ ...n, read: true })));
                toast.success("Semua notifikasi ditandai terbaca");
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-foreground transition active:scale-95 disabled:opacity-50"
            >
              <CheckCheck className="h-4 w-4" /> Tandai terbaca
            </button>
            <button
              type="button"
              onClick={() => {
                setItems([]);
                toast.success("Notifikasi dibersihkan");
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-destructive transition active:scale-95"
            >
              <Trash2 className="h-4 w-4" /> Hapus semua
            </button>
          </div>
        )}

        {items.length === 0 ? (
          <EmptyState
            icon={<Bell className="h-6 w-6" />}
            title="Tidak ada notifikasi"
            body="Pemberitahuan penjemputan dan pengumuman sekolah akan muncul di sini."
          />
        ) : (
          items.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() =>
                setItems((p) => p.map((x) => (x.id === n.id ? { ...x, read: !x.read } : x)))
              }
              className="flex w-full items-start gap-3 rounded-2xl border border-border bg-surface p-4 text-left shadow-card transition active:scale-[0.99]"
            >
              <IconBadge tone={n.read ? "muted" : "primary"}>
                <Bell className="h-4 w-4" />
              </IconBadge>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-display text-sm font-bold text-ink">{n.title}</p>
                  {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {n.time} · ketuk untuk tandai {n.read ? "belum dibaca" : "terbaca"}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
      <BottomNav />
    </PhoneShell>
  );
}
