import { createFileRoute } from "@tanstack/react-router";
import { usePageReady } from "@/hooks/use-page-ready";
import { PageSkeleton } from "@/components/feedback/Skeletons";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { IconBadge, Chip } from "@/components/common/Section";
import { EmptyState } from "@/components/feedback/EmptyState";
import { History as HistoryIcon, Search, X, RefreshCw, Users, PackageOpen, UserRoundCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { fetchPickupHistory, type PickupHistoryItem } from "@/lib/pickup/history";
import { fetchCallHistory, type CallHistoryItem } from "@/lib/call/history";
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
      { title: "Riwayat — Panggil" },
      { name: "description", content: "Riwayat penjemputan & panggilan siswa Anda." },
      { property: "og:title", content: "Riwayat" },
      { property: "og:description", content: "Cari, filter, dan lihat detail." },
    ],
  }),
  component: HistoryPage,
});

const TIME_FILTERS = ["Semua", "Hari ini", "Minggu ini"] as const;
type TimeFilter = (typeof TIME_FILTERS)[number];

const METHOD_FILTERS = ["Semua", "Jemput Sendiri", "Diwakilkan", "Ojek Online"] as const;
type MethodFilter = (typeof METHOD_FILTERS)[number];

const CALL_FILTERS = ["Semua", "Panggil Ditunggu", "Ambil Titipan"] as const;
type CallFilter = (typeof CALL_FILTERS)[number];

/** Pecah nama_siswa (dipisah koma) menjadi daftar nama per baris. */
function splitNames(student: string): string[] {
  if (!student || student === "-") return [];
  return student
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function matchesTime(ts: number, filter: TimeFilter) {
  if (filter === "Semua") return true;
  const now = Date.now();
  if (filter === "Hari ini") {
    const d = new Date(ts);
    const today = new Date(now);
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  }
  if (filter === "Minggu ini") {
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    return ts >= weekAgo && ts <= now;
  }
  return true;
}

function matchesMethod(item: { method: string }, filter: MethodFilter) {
  if (filter === "Semua") return true;
  return item.method === filter;
}

function matchesCall(item: { method: string }, filter: CallFilter) {
  if (filter === "Semua") return true;
  return item.method === filter;
}

type HistoryEntry = PickupHistoryItem | CallHistoryItem;

function HistoryList({
  loading,
  items,
  tone,
  fallbackIcon,
  emptyTitle,
  onOpen,
}: {
  loading: boolean;
  items: HistoryEntry[];
  tone: "primary" | "warm";
  fallbackIcon: React.ReactNode;
  emptyTitle: string;
  onOpen: (item: HistoryEntry) => void;
}) {
  if (loading) {
    return (
      <EmptyState
        icon={<RefreshCw className="h-6 w-6 animate-spin" />}
        title="Memuat riwayat"
        body="Mengambil data dari sistem…"
      />
    );
  }
  if (items.length === 0) {
    return (
      <EmptyState
        icon={fallbackIcon}
        title={emptyTitle}
        body="Coba ubah kata kunci pencarian atau filter."
      />
    );
  }
  return (
    <div className="space-y-2">
      {items.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onOpen(p)}
          className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 text-left shadow-card transition active:scale-[0.99]"
        >
          <IconBadge tone={tone}>
            {tone === "warm" ? <UserRoundCheck className="h-5 w-5" /> : <HistoryIcon className="h-5 w-5" />}
          </IconBadge>
          <div className="min-w-0 flex-1">
            {splitNames(p.student).length > 0 ? (
              <ul className="space-y-0.5">
                {splitNames(p.student).map((name, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-sm font-semibold text-ink">
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
      ))}
    </div>
  );
}

function HistoryPage() {
  const ready = usePageReady();
  const [q, setQ] = useState("");
  const [methodFilter, setMethodFilter] = useState<MethodFilter>("Semua");
  const [callFilter, setCallFilter] = useState<CallFilter>("Semua");
  const [detail, setDetail] = useState<PickupHistoryItem | CallHistoryItem | null>(null);
  const [pickupItems, setPickupItems] = useState<PickupHistoryItem[]>([]);
  const [callItems, setCallItems] = useState<CallHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Carousel (waktu) — swipe untuk ganti filter
  const [api, setApi] = useState<CarouselApi>();
  const [timeIndex, setTimeIndex] = useState(0);
  const timeFilter = TIME_FILTERS[timeIndex];

  // Tab utama: 0 = Jemputan, 1 = Panggil
  const [tabApi, setTabApi] = useState<CarouselApi>();
  const [tabIndex, setTabIndex] = useState(0);
  const TABS = ["Jemputan", "Panggil"] as const;

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

  useEffect(() => {
    if (!tabApi) return;
    const onSelect = () => setTabIndex(tabApi.selectedScrollSnap());
    onSelect();
    tabApi.on("select", onSelect);
    tabApi.on("reInit", onSelect);
    return () => {
      tabApi.off("select", onSelect);
      tabApi.off("reInit", onSelect);
    };
  }, [tabApi]);

  async function load() {
    setLoading(true);
    const [pickup, call] = await Promise.all([fetchPickupHistory(), fetchCallHistory()]);
    setPickupItems(pickup);
    setCallItems(call);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  if (!ready) return <PageSkeleton />;

  const term = q.trim().toLowerCase();
  const pickupList = pickupItems.filter(
    (p) =>
      matchesTime(p.ts, timeFilter) &&
      matchesMethod(p, methodFilter) &&
      (term === "" ||
        p.student.toLowerCase().includes(term) ||
        p.date.toLowerCase().includes(term) ||
        p.method.toLowerCase().includes(term)),
  );

  const callList = callItems.filter(
    (p) =>
      matchesTime(p.ts, timeFilter) &&
      matchesCall(p, callFilter) &&
      (term === "" ||
        p.student.toLowerCase().includes(term) ||
        p.date.toLowerCase().includes(term) ||
        p.method.toLowerCase().includes(term)),
  );

  const isCallTab = tabIndex === 1;
  const list = isCallTab ? callList : pickupList;

  return (
    <PhoneShell>
      <TopBar
        title="Riwayat"
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

      {/* Tab utama: Jemputan / Panggil — 2 nav tetap (di luar carousel) */}
      <div className="p-5 pb-0">
        <div className="flex gap-2">
          {TABS.map((t, i) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                tabApi?.scrollTo(i);
                setTabIndex(i);
              }}
              className={cn(
                "flex-1 shrink-0 rounded-2xl border px-3 py-2.5 text-sm font-bold transition active:scale-95",
                tabIndex === i
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Konten FULL (search + filter + list) bisa di-swipe ke kiri/kanan.
          Seluruh area dari atas sampai bawah dapat digeser — bukan hanya card. */}
      <Carousel setApi={setTabApi} opts={{ align: "start", startIndex: 0, dragFree: false }}>
        <CarouselContent className="ml-0">
          {/* Slide Jemputan */}
          <CarouselItem className="basis-full pl-0">
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

              <div className="mt-4 space-y-3">
                {/* Filter waktu */}
                <div>
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
                {/* Filter metode jemputan */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
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
                <HistoryList
                  loading={loading}
                  items={pickupList}
                  tone="primary"
                  fallbackIcon={<HistoryIcon className="h-6 w-6" />}
                  emptyTitle="Tidak ada riwayat jemputan"
                  onOpen={setDetail}
                />
              </div>
              {/* Ruang ekstra agar konten tidak tertutup indikator fixed */}
              <div className="pt-10" />
            </div>
          </CarouselItem>

          {/* Slide Panggil */}
          <CarouselItem className="basis-full pl-0">
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

              <div className="mt-4 space-y-3">
                {/* Filter waktu */}
                <div>
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
                {/* Filter metode panggil */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {CALL_FILTERS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setCallFilter(m)}
                      className={cn(
                        "shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition active:scale-95",
                        callFilter === m
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-surface text-foreground",
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <HistoryList
                  loading={loading}
                  items={callList}
                  tone="warm"
                  fallbackIcon={<PackageOpen className="h-6 w-6" />}
                  emptyTitle="Tidak ada riwayat panggilan"
                  onOpen={setDetail}
                />
              </div>
              {/* Ruang ekstra agar konten tidak tertutup indikator fixed */}
              <div className="pt-10" />
            </div>
          </CarouselItem>
        </CarouselContent>
      </Carousel>

      {/* Gradient overlay di depan card (menutupi card terakhir) — fixed di atas navbar */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-[104px] z-30 mx-auto h-16 max-w-[480px] bg-gradient-to-t from-background via-background/70 to-transparent"
      />

      {/* Indikator carousel — POSISI FIX di atas navbar, tidak ikut scroll */}
      <div className="fixed inset-x-0 bottom-[116px] z-40 mx-auto flex max-w-[480px] items-center justify-center gap-1.5 px-5">
        {TABS.map((t, i) => (
          <button
            key={t}
            type="button"
            aria-label={`Ke tab ${t}`}
            onClick={() => {
              tabApi?.scrollTo(i);
              setTabIndex(i);
            }}
            className={cn(
              "h-2 rounded-full transition-all",
              tabIndex === i ? "w-6 bg-primary" : "w-2 bg-border",
            )}
          />
        ))}
      </div>

      <DrawerPrimitive.Root open={detail !== null} onOpenChange={(o) => !o && setDetail(null)}>
        <DrawerPrimitive.Portal>
          <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-[2px]" onClick={() => setDetail(null)} />
          <DrawerPrimitive.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[70vh] w-full max-w-[480px] flex-col rounded-t-3xl border border-border bg-surface shadow-card focus:outline-none">
            <DrawerPrimitive.Handle className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-border" />
            <div className="px-5 pb-2 pt-2">
              <h2 className="font-display text-base font-bold text-ink">Detail Riwayat</h2>
            </div>
            {detail && (
              <dl className="min-h-0 flex-1 divide-y divide-border overflow-y-auto px-5 pb-6">
                <div className="flex items-start justify-between gap-3 py-2.5">
                  <dt className="mt-0.5 text-xs font-semibold text-muted-foreground">Siswa</dt>
                  <dd className="flex-1 text-right">
                    {splitNames(detail.student).length > 0 ? (
                      <ul className="space-y-1">
                        {splitNames(detail.student).map((name, i) => (
                          <li key={i} className="flex items-center justify-end gap-1.5 text-sm font-medium text-ink">
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
                  ["Tipe", detail.method],
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
