import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { usePageReady } from "@/hooks/use-page-ready";
import { PageSkeleton } from "@/components/feedback/Skeletons";
import { useEffect, useState } from "react";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { TopBar } from "@/components/layout/TopBar";
import { BigButton } from "@/components/common/BigButton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { useStudents } from "@/lib/students";
import { useActiveCall, completeCall, triggerCallRecall } from "@/lib/call/stores";
import { PackageOpen, UserRoundCheck, Megaphone, Home, Copy, Radio, Check, X } from "lucide-react";
import { notify } from "@/lib/state/notificationStore";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { secondCallOptions } from "@/lib/dummy/data";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

const COOLDOWN_MS = 180_000;

export const Route = createFileRoute("/call/monitoring")({
  head: () => ({
    meta: [
      { title: "Pantau Panggilan — Panggil" },
      { name: "description", content: "Pantau status panggilan titipan atau panggilan ditunggu." },
      { property: "og:title", content: "Pantau Panggilan" },
      { property: "og:description", content: "Status panggilan Ananda secara langsung." },
    ],
  }),
  component: CallMonitoringPage,
});

function CallMonitoringPage() {
  const ready = usePageReady();
  const nav = useNavigate();
  const { current } = useActiveCall();
  const { students } = useStudents();
  const [extras, setExtras] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [, setTick] = useState(0);

  // Tick agar hitung mundur cooldown tetap berjalan.
  useEffect(() => {
    if (!current || current.cooldownStartedAt === null) return;
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [current]);

  if (!ready) return <PageSkeleton withNav={false} />;

  if (!current) {
    return (
      <PhoneShell>
        <TopBar title="Pantau Panggilan" back="/dashboard" />
        <div className="p-5">
          <EmptyState
            icon={<Megaphone className="h-6 w-6" />}
            title="Tidak ada panggilan aktif"
            body="Belum ada panggilan titipan atau ditunggu yang sedang berjalan."
            action={<BigButton onClick={() => nav({ to: "/call/method" })}>Buat Panggilan</BigButton>}
          />
        </div>
      </PhoneShell>
    );
  }

  const isTitipan = current.type === "titipan";
  const names = current.studentIds
    .map((id) => students.find((s) => s.id === id)?.name)
    .filter(Boolean)
    .join(", ");
  const p = current.payload;

  // Cooldown: dimulai sejak panggilan pertama dibuat (createCall) atau recall.
  const inCooldown = current.cooldownStartedAt !== null;
  const startedAt = current.cooldownStartedAt ?? Date.now();
  const remaining = inCooldown ? Math.max(0, COOLDOWN_MS - (Date.now() - startedAt)) : COOLDOWN_MS;
  const remainingMinutes = Math.floor(remaining / 60000);
  const remainingSeconds = Math.floor((remaining % 60000) / 1000);
  const canRecall = inCooldown && remaining === 0;
  const cooldownProgress = inCooldown ? Math.round((remaining / COOLDOWN_MS) * 100) : 0;

  return (
    <PhoneShell>
      <TopBar
        title={isTitipan ? "Pantau Titipan" : "Pantau Panggilan"}
        back="/dashboard"
        subtitle={isTitipan ? "Ada titipan untuk Ananda" : "Ananda sedang ditunggu"}
      />

      <div className="mx-5 mt-4">
        <button
          type="button"
          onClick={() => nav({ to: "/dashboard" })}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-bold text-ink shadow-card transition active:scale-[0.98]"
        >
          <Home className="h-4 w-4" /> Kembali ke Beranda
        </button>
      </div>

      <div className="space-y-4 p-5 pb-40">
        <div className="rounded-3xl bg-gradient-hero p-5 text-primary-foreground shadow-elevated">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15">
            {isTitipan ? <PackageOpen className="h-6 w-6" /> : <UserRoundCheck className="h-6 w-6" />}
          </span>
          <p className="mt-3 font-display text-xl font-bold">
            {isTitipan
              ? current.taken
                ? "Titipan sudah diambil"
                : "Titipan belum diambil"
              : current.done
                ? "Panggilan selesai"
                : "Sedang dipanggil"}
          </p>
          <p className="mt-1 text-xs text-white/80">{names || "—"}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold text-white">
              Pemanggilan ke-{current.callCount}
            </span>
          </div>
        </div>

        {/* Progress bar cooldown panggil ulang — hanya tampil saat cooldown berjalan */}
        {inCooldown && !canRecall && (
          <div className="rounded-3xl border border-border bg-surface p-4 shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Bisa memanggil ulang dalam
              </p>
              <span className="font-display text-sm font-bold text-ink">
                {remainingMinutes}:{remainingSeconds.toString().padStart(2, "0")}
              </span>
            </div>
            <Progress value={cooldownProgress} className="mt-2 h-2.5" />
            <p className="mt-2 text-[11px] text-muted-foreground">
              Menunggu jeda sebelum bisa melakukan pemanggilan ulang.
            </p>
          </div>
        )}

        {canRecall && (
          <div className="flex items-center gap-2 rounded-3xl border border-success/30 bg-success/10 p-4 text-sm font-bold text-success-foreground">
            <Radio className="h-4 w-4" /> Sudah bisa memanggil ulang sekarang.
          </div>
        )}

        <div className="space-y-2 rounded-3xl border border-border bg-surface p-4 text-xs shadow-card">
          <Row label="Siswa" value={names || "—"} />
          {p.type === "titipan" ? (
            <>
              <Row label="Penitip" value={p.namaPenitip} />
              <Row label="Jenis titipan" value={p.jenisTitipan} />
            </>
          ) : (
            <>
              <Row label="Ditunggu oleh" value={p.ditungguOleh} />
              <Row label="Posisi tunggu" value={p.posisiTunggu} />
            </>
          )}
          {p.shortMessg ? <Row label="Pesan singkat" value={p.shortMessg} /> : null}
          <Row label="Metode" value={p.method} />
          {current.announcement ? (
            <div className="rounded-2xl bg-primary/5 p-3">
              <div className="flex items-center gap-1.5 text-primary">
                <Radio className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Kalimat pemanggilan</span>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-ink">“{current.announcement}”</p>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(current.announcement);
                  notify("Kalimat pemanggilan disalin", "Teks pemanggilan telah disalin ke clipboard.", "success");
                }}
                className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-[11px] font-semibold text-foreground transition active:scale-95"
              >
                <Copy className="h-3.5 w-3.5" /> Salin
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-[480px] space-y-2 border-t border-border bg-background/95 px-5 pb-6 pt-4 backdrop-blur">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <BigButton disabled={!canRecall}>
              {canRecall
                ? "Panggil Lagi"
                : `Panggil ulang dalam ${remainingMinutes}:${remainingSeconds.toString().padStart(2, "0")}`}
            </BigButton>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl">
            <SheetHeader>
              <SheetTitle className="font-display text-lg">Tambahkan kalimat</SheetTitle>
              <p className="text-xs text-muted-foreground">Pilih satu atau lebih kalimat tambahan.</p>
            </SheetHeader>
            <div className="mt-4 space-y-2">
              {secondCallOptions.map((o) => {
                const on = extras.includes(o);
                return (
                  <button
                    key={o}
                    onClick={() => setExtras((prev) => (on ? prev.filter((x) => x !== o) : [...prev, o]))}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition",
                      on ? "border-primary bg-primary/5" : "border-border bg-surface",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2",
                        on ? "border-primary bg-primary text-white" : "border-border",
                      )}
                    >
                      {on ? <Check className="h-3 w-3" /> : null}
                    </span>
                    <span className="text-sm text-ink">{o}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex gap-2">
              <BigButton
                variant="secondary"
                onClick={() => {
                  setExtras([]);
                  setOpen(false);
                }}
              >
                <X className="h-4 w-4" /> Batal
              </BigButton>
              <BigButton
                onClick={async () => {
                  try {
                    await triggerCallRecall(extras);
                    setExtras([]);
                    setOpen(false);
                  } catch (error) {
                    notify("Recall gagal disimpan", error instanceof Error ? error.message : "Recall gagal disimpan.", "error");
                  }
                }}
              >
                Panggil sekarang
              </BigButton>
            </div>
          </SheetContent>
        </Sheet>

        <BigButton
          onClick={() => {
            completeCall(current.id);
            nav({ to: "/call/complete", search: { t: current.type } });
          }}
        >
          {isTitipan ? "Tandai Sudah Diambil" : "Tandai Selesai"}
        </BigButton>
        <BigButton variant="secondary" onClick={() => nav({ to: "/dashboard" })}>
          Kembali ke Beranda
        </BigButton>
      </div>
    </PhoneShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[60%] text-right font-semibold text-ink">{value}</span>
    </div>
  );
}
