import { Link } from "@tanstack/react-router";
import { tips } from "@/lib/dummy/data";
import { useEffect, useState } from "react";
import { IconBadge } from "@/components/common/Section";
import { Megaphone, Lightbulb, Clock3, ShieldCheck, History as HistoryIcon, Users, ChevronRight } from "lucide-react";
import { fetchPickupHistory, type PickupHistoryItem } from "@/lib/pickup/history";
import { fetchAnnouncements, formatAnnouncementTime, type Announcement } from "@/lib/announcement";
import { Drawer as DrawerPrimitive } from "vaul";

/** Pecah nama_siswa (dipisah koma) menjadi daftar nama per baris. */
function splitNames(student: string): string[] {
  if (!student || student === "-") return [];
  return student
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function AnnouncementList() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchAnnouncements()
      .then((data) => {
        if (!active) return;
        setItems(data);
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-3 px-5">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-3xl border border-border/60 bg-surface p-4 shadow-card">
            <div className="flex items-start gap-3">
              <IconBadge tone="muted"><Megaphone className="h-5 w-5 animate-pulse" /></IconBadge>
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/3 animate-pulse rounded-full bg-surface-2" />
                <div className="h-3 w-2/3 animate-pulse rounded-full bg-surface-2" />
                <div className="h-2.5 w-1/2 animate-pulse rounded-full bg-surface-2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

if (items.length === 0) {
    return (
      <div className="relative mx-5 overflow-hidden rounded-3xl border border-primary/20 bg-surface p-6 shadow-card">
        {/* dekorasi glow biru senada theme */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-12 -left-8 h-28 w-28 rounded-full bg-primary/5 blur-3xl"
        />
        <div className="relative flex flex-col items-center gap-3 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-elevated">
            <Megaphone className="h-6 w-6" />
          </span>
          <div>
            <h3 className="font-display text-sm font-bold text-ink">
              Belum ada pengumuman dari sekolah
            </h3>
            <p className="mx-auto mt-1 max-w-[240px] text-xs leading-relaxed text-muted-foreground">
              Kami akan menyampaikan informasi terbaru melalui halaman ini.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 px-5">
      {items.map((a) => (
        <article key={a.id} className="rounded-3xl border border-border/60 bg-surface p-4 shadow-card">
          <div className="flex items-start gap-3">
            <IconBadge tone="warm">
              <Megaphone className="h-5 w-5" />
            </IconBadge>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent-foreground">Pengumuman</span>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {formatAnnouncementTime(a.createdAt)}
                </span>
              </div>
              <h3 className="mt-1 font-display text-sm font-bold text-ink">{a.judul}</h3>
              {a.isi ? (
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{a.isi}</p>
              ) : null}
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
  const [items, setItems] = useState<PickupHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<PickupHistoryItem | null>(null);

  useEffect(() => {
    let active = true;
    fetchPickupHistory()
      .then((data) => {
        if (!active) return;
        setItems(data);
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="mx-5 space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-surface px-4 py-3 shadow-card">
            <IconBadge tone="muted"><HistoryIcon className="h-5 w-5 animate-pulse" /></IconBadge>
            <div className="flex-1 space-y-2">
              <div className="h-3 w-2/3 animate-pulse rounded-full bg-surface-2" />
              <div className="h-2.5 w-1/3 animate-pulse rounded-full bg-surface-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-5 flex items-center gap-3 rounded-3xl border border-dashed border-border bg-surface px-4 py-5 shadow-card">
        <IconBadge tone="muted"><HistoryIcon className="h-5 w-5" /></IconBadge>
        <p className="text-xs text-muted-foreground">Belum ada penjemputan tercatat.</p>
      </div>
    );
  }

  // Tampilkan maksimal 4 data. 2 blok terakhir makin ke bawah memudar
  // (gradient) hingga transparan, lalu di timpa tombol "Lihat selengkapnya".
  const shown = items.slice(0, 4);
  const fadeStart = 2; // mulai memudar dari indeks ke-2 (blok ke-3)

  return (
    <>
      <div className="relative mx-5">
        <div className="space-y-2">
          {shown.map((p, i) => {
            const isFading = i >= fadeStart;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setDetail(p)}
                className="relative flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-surface px-4 py-3 text-left shadow-card transition active:scale-[0.99]"
                style={{
                  maskImage: isFading
                    ? `linear-gradient(180deg, black 0%, black ${100 - (i - fadeStart + 1) * 30}%, transparent 100%)`
                    : undefined,
                  WebkitMaskImage: isFading
                    ? `linear-gradient(180deg, black 0%, black ${100 - (i - fadeStart + 1) * 30}%, transparent 100%)`
                    : undefined,
                }}
              >
                <IconBadge tone="muted"><Clock3 className="h-5 w-5" /></IconBadge>
                <div className="min-w-0 flex-1">
                  {/* Nama siswa ber-shaf: 1 nama per baris */}
                  {splitNames(p.student).length > 0 ? (
                    <ul className="space-y-0.5">
                      {splitNames(p.student).map((name, j) => (
                        <li key={j} className="flex items-center gap-1.5 text-sm font-semibold text-ink">
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
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {p.method} · {p.date} · {p.time}
                  </p>
                </div>
                <span className="rounded-full bg-success/15 px-2.5 py-1 text-[10px] font-bold text-success-foreground">{p.status}</span>
              </button>
            );
          })}
        </div>

        {/* Gradient overlay + tombol "Lihat selengkapnya" */}
        {shown.length > fadeStart && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-28 items-end justify-center bg-gradient-to-b from-background/0 to-background pb-3">
            <Link
              to="/history"
              className="pointer-events-auto inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-card transition active:scale-95"
            >
              Lihat selengkapnya <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* Detail drawer — bisa di-swipe tutup */}
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
                        {splitNames(detail.student).map((name, j) => (
                          <li key={j} className="flex items-center justify-end gap-1.5 text-sm font-medium text-ink">
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
    </>
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
