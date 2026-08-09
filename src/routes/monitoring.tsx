import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { usePageReady } from "@/hooks/use-page-ready";
import { MonitoringSkeleton } from "@/components/feedback/Skeletons";
import { useEffect, useState } from "react";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { TopBar } from "@/components/layout/TopBar";
import { useActivePickup, STAGE_LABELS } from "@/lib/state/stores";
import {
  completeAndStartCooldown,
  finishAndArchive,
  triggerSecondCall,
} from "@/lib/pickup/simulator";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { QrOnlyMonitoring } from "@/components/monitoring/QrOnlyMonitoring";
import { SectionHeader, IconBadge, Chip } from "@/components/common/Section";
import {
  Radio,
  Volume2,
  Copy,
  Server,
  Cpu,
  ClipboardCheck,
  ClipboardX,
MessageSquareText,
  Check,
  X,
  Home,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/feedback/EmptyState";
import { BigButton } from "@/components/common/BigButton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { secondCallOptions } from "@/lib/dummy/data";
import { useStudents } from "@/lib/students";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

const COOLDOWN_MS = 180_000;

export const Route = createFileRoute("/monitoring")({
  head: () => ({
    meta: [
      { title: "Monitoring — Panggil" },
      { name: "description", content: "Pantau proses pemanggilan siswa secara langsung." },
      { property: "og:title", content: "Monitoring Penjemputan" },
      { property: "og:description", content: "Setiap tahapan proses transparan dan mudah dipahami." },
    ],
  }),
  component: Monitoring,
});

function Monitoring() {
  const ready = usePageReady();
const { current } = useActivePickup();
const { students } = useStudents();
  const nav = useNavigate();
  const [extras, setExtras] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [confirmDone, setConfirmDone] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (current?.stage === "done" && current.cooldownStartedAt === null) {
      completeAndStartCooldown();
    }
  }, [current]);

  // Tick agar hitung mundur tetap berjalan saat cooldown aktif.
  useEffect(() => {
    if (!current || current.cooldownStartedAt === null) return;
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [current]);

  if (!ready) return <MonitoringSkeleton />;

  if (!current) {
    return (
      <PhoneShell>
        <TopBar title="Monitoring" back="/dashboard" />
        <div className="p-5">
          <EmptyState
            title="Belum ada penjemputan aktif"
            body="Mulai penjemputan dari beranda untuk melihat proses di sini."
            action={<BigButton onClick={() => nav({ to: "/pickup/method" })}>Mulai Penjemputan</BigButton>}
          />
        </div>
      </PhoneShell>
    );
  }

// Mode sistem QR: halaman hanya berisi QR + kode pemanggilan.
  if (current.qrCode) {
    return <QrOnlyMonitoring current={current} />;
  }
  const inCooldown = current.cooldownStartedAt !== null;
  const startedAt = current.cooldownStartedAt ?? Date.now();
  const remaining = inCooldown ? Math.max(0, COOLDOWN_MS - (Date.now() - startedAt)) : COOLDOWN_MS;
  const remainingMinutes = Math.floor(remaining / 60000);
  const remainingSeconds = Math.floor((remaining % 60000) / 1000);
const canRecall = inCooldown && remaining === 0;
  // Progress cooldown: dari penuh (belum bisa panggil) turun ke 0 (sudah bisa panggil ulang).
  const cooldownProgress = inCooldown ? Math.round((remaining / COOLDOWN_MS) * 100) : 0;

  const student = students.find((s) => s.id === current.studentIds[0]);
  const teacherNote =
    current.callCount >= 2 ? "Ananda masih menyelesaikan tugas di kelas, mohon menunggu sebentar." : null;
const lastLabel = STAGE_LABELS[current.stage] ?? "Sedang dipanggil";
  const isSelfPickup = current.method === "self";
  const pickerLabel =
    current.method === "ojek" ? "driver ojek online" : current.pickerName || "penjemput yang dipilih";

  return (
    <PhoneShell>
      <TopBar title="Monitoring Penjemputan" back="/dashboard" subtitle="Ananda sedang menuju gerbang" />

<div className="mx-5 mt-4">
        <button
          type="button"
          onClick={() => nav({ to: "/dashboard" })}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-bold text-ink shadow-card transition active:scale-[0.98]"
        >
          <Home className="h-4 w-4" /> Kembali ke Beranda
        </button>
      </div>

      <div className="mx-5 mt-4 rounded-3xl bg-gradient-hero p-5 text-primary-foreground shadow-elevated">
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">Status saat ini</p>
        <p className="font-display text-lg font-bold leading-tight">{lastLabel}</p>
<div className="mt-2 flex flex-wrap gap-1.5">
          <Chip className="bg-white/15 text-white">Pemanggilan ke-{current.callCount}</Chip>
          <Chip className="bg-white/15 text-white">Speaker aktif</Chip>

        </div>
      </div>

{/* Progress bar cooldown panggil ulang — hanya tampil saat cooldown benar-benar berjalan */}
      {inCooldown && !canRecall && (
        <div className="mx-5 mt-4 rounded-3xl border border-border bg-surface p-4 shadow-card">
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

      {student && (
        <>
          <SectionHeader title="Status Presensi Pulang" className="mt-8" />
          <div className="mx-5 flex items-center gap-3 rounded-3xl border border-border bg-surface p-4 shadow-card">
            <IconBadge tone={student.dismissStatus === "sudah" ? "success" : "muted"}>
              {student.dismissStatus === "sudah" ? (
                <ClipboardCheck className="h-5 w-5" />
              ) : (
                <ClipboardX className="h-5 w-5" />
              )}
            </IconBadge>
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-bold text-ink">{student.name}</p>
              <p className="text-xs text-muted-foreground">
                {student.dismissStatus === "sudah"
                  ? `Sudah presensi pulang · ${student.dismissedAt}`
                  : "Belum melakukan presensi pulang"}
              </p>
            </div>
          </div>
        </>
      )}

      {teacherNote && (
        <>
          <SectionHeader title="Keterangan Wali Kelas" className="mt-8" />
          <div className="mx-5 flex items-start gap-3 rounded-3xl border border-border bg-surface p-4 shadow-card">
            <IconBadge tone="warm">
              <MessageSquareText className="h-5 w-5" />
            </IconBadge>
            <p className="text-sm leading-relaxed text-ink">{teacherNote}</p>
          </div>
        </>
      )}

      {!current.qrCode && (
        <>
          <SectionHeader title="Pratinjau Pengumuman" className="mt-8" />
          <div className="mx-5 rounded-3xl border border-border bg-surface p-5 shadow-card">
            <div className="flex items-center gap-2 text-primary">
              <Volume2 className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Kalimat pemanggilan</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink">“{current.announcement}”</p>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground animate-pulse-ring">
                  <Radio className="h-4 w-4" />
                </span>
                <span className="text-[11px] text-muted-foreground">Pratinjau audio (dummy)</span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(current.announcement);
                  toast.success("Kalimat pemanggilan disalin");
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-[11px] font-semibold text-foreground transition active:scale-95"
              >
                <Copy className="h-3.5 w-3.5" /> Salin
              </button>
            </div>
          </div>
          <br /><br /><br />
        </>
      )}

      {/* <SectionHeader title="Status Sistem" className="mt-8" />
      <div className="mx-5 grid grid-cols-2 gap-3">
        <SystemTile icon={<Server className="h-4 w-4" />} title="Server" status="Normal" />
        <SystemTile icon={<Cpu className="h-4 w-4" />} title="AI" status="Aktif" />
        <SystemTile icon={<Volume2 className="h-4 w-4" />} title="Speaker" status="Tersedia" />
        <SystemTile icon={<Radio className="h-4 w-4" />} title="Antrean" status="2 permintaan" />
      </div> */}

      <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t bg-background/95 p-5 backdrop-blur">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <BigButton 
               disabled={!canRecall}>{canRecall
    ? "Panggil Lagi"
    : `Panggil ulang dalam ${remainingMinutes}:${remainingSeconds
          .toString()
          .padStart(2, "0")}`}
          
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
                onClick={() => {
                  triggerSecondCall(extras);
                  setExtras([]);
                  setOpen(false);
                }}
              >
                Panggil sekarang
              </BigButton>
            </div>
          </SheetContent>
        </Sheet>

        <BigButton variant="secondary" onClick={() => setConfirmDone(true)}>
          {isSelfPickup ? "Selesai — anak sudah dijemput" : "Selesai"}
        </BigButton>
      </div>

      <ConfirmDialog
        open={confirmDone}
        title={isSelfPickup ? "Ananda sudah bersama Anda?" : "Selesaikan penjemputan?"}
        description={
          isSelfPickup
            ? "Pastikan Ananda benar-benar sudah berada bersama Anda di gerbang sebelum menyelesaikan penjemputan. Status ini akan tercatat di riwayat."
            : `Pastikan Ananda sudah dijemput oleh ${pickerLabel}. Penjemputan akan ditutup dan otomatis tersimpan ke riwayat.`
        }
        confirmLabel={isSelfPickup ? "Ya, sudah bersama saya" : "Ya, selesaikan"}
        cancelLabel="Belum"
        onCancel={() => setConfirmDone(false)}
        onConfirm={() => {
          setConfirmDone(false);
          finishAndArchive();
          toast.success("Penjemputan selesai & disimpan ke riwayat");
          nav({ to: "/pickup/complete" });
        }}
      />
    </PhoneShell>
  );
}

function SystemTile({ icon, title, status }: { icon: React.ReactNode; title: string; status: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 shadow-card">
      <IconBadge tone="success">{icon}</IconBadge>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
        <p className="text-xs font-semibold text-ink">{status}</p>
      </div>
    </div>
  );
}
