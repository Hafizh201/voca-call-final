import { createFileRoute } from "@tanstack/react-router";
import { usePageReady } from "@/hooks/use-page-ready";
import { PageSkeleton } from "@/components/feedback/Skeletons";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { recentPickups } from "@/lib/dummy/data";
import { IconBadge, Chip } from "@/components/common/Section";
import { History as HistoryIcon, Search } from "lucide-react";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Riwayat Penjemputan — Panggil" },
      { name: "description", content: "Semua riwayat pemanggilan penjemputan siswa Anda." },
      { property: "og:title", content: "Riwayat Penjemputan" },
      { property: "og:description", content: "Cari, filter, dan lihat detail." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const ready = usePageReady();
  if (!ready) return <PageSkeleton />;
  return (
    <PhoneShell>
      <TopBar title="Riwayat Penjemputan" back="/dashboard" />
      <div className="p-5">
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-3 py-2 shadow-card">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input placeholder="Cari nama siswa atau tanggal" className="w-full bg-transparent text-sm outline-none" />
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
          {["Semua", "Hari ini", "Minggu ini", "Bulan ini"].map((t, i) => (
            <Chip key={t} tone={i === 0 ? "primary" : "neutral"}>{t}</Chip>
          ))}
        </div>
        <div className="mt-4 space-y-2">
          {recentPickups.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 shadow-card">
              <IconBadge tone="primary"><HistoryIcon className="h-5 w-5" /></IconBadge>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{p.student} · {p.method}</p>
                <p className="text-[11px] text-muted-foreground">{p.date} · {p.time}</p>
              </div>
              <Chip tone="success">{p.status}</Chip>
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </PhoneShell>
  );
}
