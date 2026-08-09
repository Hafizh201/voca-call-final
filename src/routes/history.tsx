import { createFileRoute } from "@tanstack/react-router";
import { usePageReady } from "@/hooks/use-page-ready";
import { PageSkeleton } from "@/components/feedback/Skeletons";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { IconBadge, Chip } from "@/components/common/Section";
import { EmptyState } from "@/components/feedback/EmptyState";
import { History as HistoryIcon, Search, X, RefreshCw, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { fetchPickupHistory, type PickupHistoryItem } from "@/lib/pickup/history";
import { Drawer as DrawerPrimitive } from "vaul";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

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

const TIME_FILTERS = ["Semua", "Hari ini", "Minggu ini"] as const;
type TimeFilter = (typeof TIME_FILTERS)[number];

const METHOD_FILTERS = ["Semua", "Jemput Sendiri", "Diwakilkan", "Ojek Online"] as const;
type MethodFilter = (typeof METHOD_FILTERS)[number];

/** Pecah nama_siswa (dipisah koma) menjadi daftar nama per baris. */
function splitNames(student: string): string[] {
  if (!student || student === "-") return [];
  return student
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function matchesTime(item: PickupHistoryItem, filter: TimeFilter) {
  if (filter === "Semua") return true;
  const now = Date.now();
  if (filter === "Hari ini") {
    const d = new Date(item.ts);
    const today = new Date(now);
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  }
  if (filter === "Minggu ini") {
    // Jendela 7 hari ke belakang dari sekarang (rolling window).
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    return item.ts >= weekAgo && item.ts <= now;
  }
  return true;
}

function matchesMethod(item: PickupHistoryItem, filter: MethodFilter) {
  if (filter === "Semua") return true;
  return item.method === filter;
}

function HistoryPage() {
  const ready = usePageReady();
  const [q, setQ] = useState("");
  const [methodFilter, setMethodFilter] = useState<MethodFilter>("Semua");
  const [detail, setDetail] = useState<PickupHistoryItem | null>(null);
  const [items, setItems] = useState<PickupHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Carousel (waktu) — swipe untuk ganti filter
  const [api, setApi] = useState<CarouselApi>();
  const [timeIndex, setTimeIndex] = useState(0);
  const timeFilter = TIME_FILTERS[timeIndex];

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setTimeIndex(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);

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
      matchesTime(p, timeFilter) &&
      matchesMethod(p, methodFilter) &&
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

        {/* Filter waktu — carousel swipe */}
        <div className="mt-4">
          <Carousel setApi={setApi} className="w-full" opts={{ align: "start", dragFree: true }}>
            <CarouselContent className="-ml-2">
              {TIME_FILTERS.map((t, i) => (
                <CarouselItem key={t} className="basis-auto pl-2">
                  <button
                    type="button"
                    onClick={() => {
                      api?.scrollTo(i);
                      setTimeIndex(i);
                    }}
                    className={cn(
                      "shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition active:scale-95",
                      timeFilter === t
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-surface text-foreground",
                    )}
                  >
                    {t}
                  </button>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        {/* Filter metode penjemputan */}
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
          {METHOD_FILTERS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethodFilter(m)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition active:scale-95",
                methodFilter === m
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface text-foreground",
              )}
            >
              {m}
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
              body="Coba ubah kata kunci pencarian atau filter."
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
                  {/* Nama siswa ber-shaf: 1 nama per baris */}
                  {splitNames(p.student).length > 0 ? (
                    <ul className="space-y-0.5">
                      {splitNames(p.student).map((name, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-1.5 text-sm font-semibold text-ink"
                        >
                          <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                            <Users className="h-2.5 w-2.5" />
                          </span>
                          <span className="truncate">{name}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="truncate text-sm font-semibold text-ink">{p.student}</p>
                  )}
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {p.method} · {p.date} · {p.time}
                  </p>
                </div>
                <Chip tone={p.status === "Selesai" ? "success" : "warning"}>{p.status}</Chip>
              </button>
            ))
          )}
        </div>
      </div>

      <DrawerPrimitive.Root open={detail !== null} onOpenChange={(o) => !o && setDetail(null)}>
        <DrawerPrimitive.Portal>
          <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-[2px]" onClick={() => setDetail(null)} />
          <DrawerPrimitive.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[70vh] w-full max-w-[480px] flex-col rounded-t-3xl border border-border bg-surface shadow-card focus:outline-none">
            <DrawerPrimitive.Handle className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-border" />
            <div className="px-5 pb-2 pt-2">
              <h2 className="font-display text-base font-bold text-ink">Detail Penjemputan</h2>
            </div>
            {detail && (
              <dl className="min-h-0 flex-1 divide-y divide-border overflow-y-auto px-5 pb-6">
                <div className="flex items-start justify-between gap-3 py-2.5">
                  <dt className="mt-0.5 text-xs font-semibold text-muted-foreground">Siswa</dt>
                  <dd className="flex-1 text-right">
                    {splitNames(detail.student).length > 0 ? (
                      <ul className="space-y-1">
                        {splitNames(detail.student).map((name, i) => (
                          <li
                            key={i}
                            className="flex items-center justify-end gap-1.5 text-sm font-medium text-ink"
                          >
                            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                              <Users className="h-3 w-3" />
                            </span>
                            {name}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-sm font-medium text-ink">{detail.student}</span>
                    )}
                  </dd>
                </div>
                {[
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
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Portal>
      </DrawerPrimitive.Root>

      <BottomNav />
    </PhoneShell>
);
}
