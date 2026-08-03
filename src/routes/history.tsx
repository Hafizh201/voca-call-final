import { createFileRoute } from "@tanstack/react-router";
import { usePageReady } from "@/hooks/use-page-ready";
import { PageSkeleton } from "@/components/feedback/Skeletons";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { recentPickups } from "@/lib/dummy/data";
import { IconBadge, Chip } from "@/components/common/Section";
import { EmptyState } from "@/components/feedback/EmptyState";
import { History as HistoryIcon, Search, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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

type Item = (typeof recentPickups)[number];

const FILTERS = ["Semua", "Hari ini", "Minggu ini", "Bulan ini"] as const;
type Filter = (typeof FILTERS)[number];

function matchesFilter(item: Item, filter: Filter) {
  if (filter === "Semua") return true;
  if (filter === "Hari ini") return item.date === "Hari ini";
  if (filter === "Minggu ini") return ["Hari ini", "Kemarin", "2 hari lalu", "Senin"].includes(item.date);
  return true;
}

function HistoryPage() {
  const ready = usePageReady();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("Semua");
  const [detail, setDetail] = useState<Item | null>(null);
  if (!ready) return <PageSkeleton />;

  const term = q.trim().toLowerCase();
  const list = recentPickups.filter(
    (p) =>
      matchesFilter(p, filter) &&
      (term === "" ||
        p.student.toLowerCase().includes(term) ||
        p.date.toLowerCase().includes(term) ||
        p.method.toLowerCase().includes(term)),
  );

  return (
    <PhoneShell>
      <TopBar title="Riwayat Penjemputan" back="/dashboard" subtitle={`${list.length} data ditampilkan`} />
      <div className="p-5">
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-3 py-2 shadow-card">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama siswa atau tanggal"
            className="w-full bg-transparent text-sm outline-none"
          />
          {q && (
            <button type="button" aria-label="Bersihkan pencarian" onClick={() => setQ("")}>
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
          {FILTERS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilter(t)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition active:scale-95",
                filter === t
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-2">
          {list.length === 0 ? (
            <EmptyState
              icon={<HistoryIcon className="h-6 w-6" />}
              title="Tidak ada riwayat"
              body="Coba ubah kata kunci pencarian atau filter tanggal."
            />
          ) : (
            list.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setDetail(p)}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 text-left shadow-card transition active:scale-[0.99]"
              >
                <IconBadge tone="primary">
                  <HistoryIcon className="h-5 w-5" />
                </IconBadge>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {p.student} · {p.method}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {p.date} · {p.time}
                  </p>
                </div>
                <Chip tone="success">{p.status}</Chip>
              </button>
            ))
          )}
        </div>
      </div>

      <Sheet open={detail !== null} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>Detail Penjemputan</SheetTitle>
          </SheetHeader>
          {detail && (
            <dl className="mt-2 divide-y divide-border px-1 pb-6">
              {[
                ["Siswa", detail.student],
                ["Metode", detail.method],
                ["Tanggal", detail.date],
                ["Waktu", detail.time],
                ["Status", detail.status],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3 py-2.5">
                  <dt className="text-xs font-semibold text-muted-foreground">{k}</dt>
                  <dd className="text-sm font-medium text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </SheetContent>
      </Sheet>

      <BottomNav />
    </PhoneShell>
  );
}
