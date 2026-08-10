import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { usePageReady } from "@/hooks/use-page-ready";
import { PageSkeleton } from "@/components/feedback/Skeletons";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useNotifications,
  markAllNotificationsRead,
  clearNotifications,
} from "@/lib/state/notificationStore";
import { NotificationInboxItem } from "@/components/notifications/NotificationsFloating";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifikasi — Panggil" },
      {
        name: "description",
        content: "Semua pemberitahuan penjemputan dan sekolah.",
      },
      { property: "og:title", content: "Pusat Notifikasi" },
      { property: "og:description", content: "Belum dibaca dan sudah dibaca." },
    ],
  }),
  component: Notifs,
});

type Filter = "semua" | "belum" | "sudah";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "semua", label: "Semua" },
  { key: "belum", label: "Belum dibaca" },
  { key: "sudah", label: "Sudah dibaca" },
];

function Notifs() {
  const ready = usePageReady();
  const all = useNotifications();
  const [filter, setFilter] = useState<Filter>("semua");

  if (!ready) return <PageSkeleton />;

  const items = all.filter((n) => {
    if (filter === "belum") return !n.read;
    if (filter === "sudah") return n.read;
    return true;
  });
  const unread = all.filter((n) => !n.read).length;

  return (
    <PhoneShell>
      <TopBar
        title="Notifikasi"
        back="/dashboard"
        subtitle={unread > 0 ? `${unread} belum dibaca` : "Semua sudah dibaca"}
      />

      <div className="space-y-2 p-5">
        {/* Segmented filter */}
        <div className="flex gap-1.5 rounded-2xl border border-border bg-surface-2/70 p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "flex-1 rounded-xl px-2 py-2 text-[11px] font-bold transition",
                filter === f.key
                  ? "bg-gradient-to-br from-primary to-oklch(0.45 0.11 275) text-white shadow-card"
                  : "text-muted-foreground hover:text-ink",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {all.length > 0 && (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={unread === 0}
              onClick={() => {
                markAllNotificationsRead();
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-foreground transition active:scale-95 disabled:opacity-50"
            >
              <CheckCheck className="h-4 w-4" /> Tandai terbaca
            </button>
            <button
              type="button"
              onClick={() => {
                clearNotifications();
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-destructive transition active:scale-95"
            >
              <Trash2 className="h-4 w-4" /> Hapus semua
            </button>
          </div>
        )}

        {items.length === 0 ? (
          <div className="pt-6">
            <EmptyState
              icon={<Bell className="h-6 w-6" />}
              title={
                filter === "belum"
                  ? "Tidak ada yang belum dibaca"
                  : filter === "sudah"
                    ? "Belum ada yang dibaca"
                    : "Tidak ada notifikasi"
              }
              body={
                filter === "belum"
                  ? "Semua pemberitahuan sudah kamu baca. Geser daftar lain untuk melihat."
                  : filter === "sudah"
                    ? "Notifikasi yang sudah kamu baca akan tampil di sini."
                    : "Pemberitahuan penjemputan dan pengumuman sekolah akan muncul di sini."
              }
            />
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((n) => (
              <NotificationInboxItem key={n.id} notification={n} />
            ))}
            <p className="py-2 text-center text-[10px] text-muted-foreground">
              Ketuk notifikasi untuk menandainya sudah atau belum dibaca
            </p>
          </div>
        )}
      </div>
      <BottomNav />
    </PhoneShell>
  );
}
