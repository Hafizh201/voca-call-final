import { createFileRoute } from "@tanstack/react-router";
import { usePageReady } from "@/hooks/use-page-ready";
import { PageSkeleton } from "@/components/feedback/Skeletons";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { IconBadge, Chip } from "@/components/common/Section";
import { EmptyState } from "@/components/feedback/EmptyState";
import { History as HistoryIcon, Search, X, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { fetchPickupHistory, type PickupHistoryItem } from "@/lib/pickup/history";
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

const FILTERS = ["Semua", "Hari ini", "Minggu ini", "Bulan ini"] as const;
type Filter = (typeof FILTERS)[number];

function matchesFilter(item: PickupHistoryItem, filter: Filter) {
  if (filter === "Semua") return true;
  const now = new Date();
  const d = parseDate(item.date);
  if (!d) return true;
  if (filter === "Hari ini") {
    return d.toDateString() === now.toDateString();
  }
  if (filter === "Minggu ini") {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    return d >= start;
  }
  if (filter === "Bulan ini") {
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }
  return true;
}

/** Coba parse tanggal dalam format id-ID (mis. "Senin, 6 Januari 2025"). */
function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr === "-") return null;
  const parts = dateStr.split(",");
  if (parts.length < 2) return null;
  const map: Record<string, number> = {
    Januari: 0, Februari: 1, Maret: 2, April: 3, Mei: 4, Juni: 5,
    Juli: 6, Agustus: 7, September: 8, Oktober: 9, November: 10, Desember: 11,
  };
  const m = parts[1].trim().match(/(\d+)\s+([A-Za-z]+)\s+(\d{4})/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = map[m[2]];
  const year = Number(m[3]);
  if (month === undefined || isNaN(day) || isNaN(year)) return null;
  return new Date(year, month, day);
}

function HistoryPage() {
  const ready = usePageReady();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("Semua");
  const [detail, setDetail] = useState<PickupHistoryItem | null>(null);
  const [items, setItems] = useState<PickupHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const data = await fetchPickupHistory();
    setItems(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  if (!ready) return <PageSkeleton />;

  const term = q.trim().toLowerCase();
  const list = items.filter(
    (p) =>
      matchesFilter(p, filter) &&
      (term === "" ||
        p.student.toLowerCase().includes(term) ||
        p.date.toLowerCase().includes(term) ||
        p.method.toLowerCase().includes(term)),
  );

  return (
    <PhoneShell>
      <TopBar
        title="Riwayat Penjemputan"
        back="/dashboard"
        subtitle={loading ? "Memuat data…" : `${list.length} data ditampilkan`}
        right={
          <button
            type="button"
            onClick={load}
            aria-label="Muat ulang"
            className="grid h-9 w-9 place-items-center rounded-xl bg-surface-2 text-muted-foreground active:scale-95"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
        }
      />
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
          {loading ? (
            <EmptyState
              icon={<RefreshCw className="h-6 w-6 animate-spin" />}
              title="Memuat riwayat"
              body="Mengambil data dari sistem…"
            />
          ) : list.length === 0 ? (
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
                <Chip tone={p.status === "Selesai" ? "success" : "warning"}>{p.status}</Chip>
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
