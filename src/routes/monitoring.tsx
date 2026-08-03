import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { usePageReady } from "@/hooks/use-page-ready";
import { MonitoringSkeleton } from "@/components/feedback/Skeletons";
import { useEffect, useState } from "react";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { TopBar } from "@/components/layout/TopBar";
import { useActivePickup } from "@/lib/state/stores";
import {
  completeAndStartCooldown,
  finishAndArchive,
  triggerSecondCall,
} from "@/lib/pickup/simulator";
import { ActivityTimeline } from "@/components/monitoring/StageStepper";
import { CircularCooldownTimer } from "@/components/monitoring/CircularCooldownTimer";

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
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/feedback/EmptyState";
import { BigButton } from "@/components/common/BigButton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { students, secondCallOptions } from "@/lib/dummy/data";
import { cn } from "@/lib/utils";

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
  const nav = useNavigate();
  const [extras, setExtras] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (current?.stage === "done" && current.cooldownStartedAt === null) {
      completeAndStartCooldown();
    }
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
  const canRecall = inCooldown && remaining === 0;

  const student = students.find((s) => s.id === current.studentIds[0]);
  const teacherNote =
    current.callCount >= 2 ? "Ananda masih menyelesaikan tugas di kelas, mohon menunggu sebentar." : null;
  const lastLabel = current.timeline[current.timeline.length - 1]?.label;

  return (
    <PhoneShell>
      <TopBar title="Monitoring Penjemputan" back="/dashboard" subtitle="Ananda sedang menuju gerbang" />

      <div className="mx-5 mt-4 rounded-3xl bg-gradient-hero p-5 text-primary-foreground shadow-elevated">
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">Status saat ini</p>
        <p className="font-display text-lg font-bold leading-tight">{lastLabel}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Chip className="bg-white/15 text-white">Pemanggilan ke-{current.callCount}</Chip>
          <Chip className="bg-white/15 text-white">Speaker aktif</Chip>

        </div>
      </div>

      {inCooldown && (
      <div className="mt-6 flex flex-col items-center px-5">
        <CircularCooldownTimer
          startedAt={startedAt}
          durationMs={COOLDOWN_MS}
          onDone={() => setTick((t) => t + 1)}
        />
        <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
          {canRecall
            ? "Anda sudah dapat memanggil ulang bila Ananda belum tiba."
            : "Mohon menunggu — pemanggilan ulang tersedia setelah hitungan selesai."}
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
        </>
      )}

      <SectionHeader title="Status Sistem" className="mt-8" />
      <div className="mx-5 grid grid-cols-2 gap-3">
        <SystemTile icon={<Server className="h-4 w-4" />} title="Server" status="Normal" />
        <SystemTile icon={<Cpu className="h-4 w-4" />} title="AI" status="Aktif" />
        <SystemTile icon={<Volume2 className="h-4 w-4" />} title="Speaker" status="Tersedia" />
        <SystemTile icon={<Radio className="h-4 w-4" />} title="Antrean" status="2 permintaan" />
      </div>

      <div className="mx-5 mt-8 space-y-3 pb-8">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <BigButton disabled={!canRecall}>{canRecall ? "Panggil Lagi" : "Menunggu cooldown…"}</BigButton>
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
          Selesai — anak sudah dijemput
        </BigButton>
      </div>

      <ConfirmDialog
        open={confirmDone}
        title="Ananda sudah bersama Anda?"
        description="Pastikan Ananda benar-benar sudah berada bersama Anda di gerbang sebelum menyelesaikan penjemputan. Status ini akan tercatat di riwayat."
        confirmLabel="Ya, sudah bersama saya"
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
