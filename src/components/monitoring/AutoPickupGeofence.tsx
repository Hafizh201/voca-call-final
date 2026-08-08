import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  MapPin,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Wifi,
  ShieldAlert,
  Clock,
  Users,
  Megaphone,
  Hourglass,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BottomSheet } from "@/components/common/BottomSheet";


import { pickupStore, useActivePickup, STAGE_ORDER, type PickupStage } from "@/lib/state/stores";
import { nowHHmm } from "@/lib/format/utils";
import { useStudentsCache } from "@/lib/students";
import { pickupBlockReason, isPastDismissalTime, nowWIB } from "@/lib/pickup/callDeadline";

type GpsState = "searching" | "outside" | "approaching" | "arrived" | "standby" | "unavailable";

const DISTANCE_SEQUENCE = [2100, 1400, 900, 500, 250, 150, 120, 85, 50, 0];

function formatDistance(m: number) {
  if (m <= 0) return "Masuk Radius";
  if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
  return `${m} m`;
}

const TONE: Record<GpsState, { ring: string; text: string; bg: string; chip: string; label: string }> = {
  searching: {
    ring: "ring-primary/20",
    text: "text-primary",
    bg: "from-primary/10 to-primary/5",
    chip: "bg-primary/10 text-primary",
    label: "Mencari",
  },
  outside: {
    ring: "ring-primary/30",
    text: "text-primary",
    bg: "from-primary/15 to-primary/5",
    chip: "bg-primary/10 text-primary",
    label: "Di luar radius",
  },
  approaching: {
    ring: "ring-accent/40",
    text: "text-accent-foreground",
    bg: "from-accent/25 to-accent/10",
    chip: "bg-accent/25 text-accent-foreground",
    label: "Mendekati",
  },
  arrived: {
    ring: "ring-success/40",
    text: "text-success-foreground",
    bg: "from-success/25 to-success/10",
    chip: "bg-success/25 text-success-foreground",
    label: "Tiba",
  },
  standby: {
    ring: "ring-info/40",
    text: "text-info-foreground",
    bg: "from-info/20 to-info/10",
    chip: "bg-info/20 text-info-foreground",
    label: "Menunggu jam pulang",
  },
  unavailable: {
    ring: "ring-warning/50",
    text: "text-warning-foreground",
    bg: "from-warning/25 to-warning/10",
    chip: "bg-warning/25 text-warning-foreground",
    label: "Tidak tersedia",
  },
};

// ===== Persistensi sepanjang hari (localStorage) =====
const STORAGE_PREFIX = "auto-pickup-v1";

function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function loadPersisted(): { ids: string[] } | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { date?: string; ids?: string[] };
    // Hanya berlaku untuk hari yang sama. Hari berganti → reset (mati).
    if (parsed.date !== todayKey()) {
      localStorage.removeItem(STORAGE_PREFIX);
      return null;
    }
    return { ids: Array.isArray(parsed.ids) ? parsed.ids : [] };
  } catch {
    return null;
  }
}

function savePersisted(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_PREFIX, JSON.stringify({ date: todayKey(), ids }));
  } catch {
    /* ignore */
  }
}

function clearPersisted() {
  try {
    localStorage.removeItem(STORAGE_PREFIX);
  } catch {
    /* ignore */
  }
}

export function AutoPickupGeofence() {
  const { current } = useActivePickup();
  const students = useStudentsCache();
  const selectableStudents = useMemo(() => students.filter((s) => !s.pendingApproval), [students]);

  // State awal di-*hydrate* dari localStorage (aktif sepanjang hari yang sama).
  const [autoMode, setAutoMode] = useState<boolean>(() => loadPersisted() !== null);
  const [selectedIds, setSelectedIds] = useState<string[]>(() => loadPersisted()?.ids ?? []);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [closedOpen, setClosedOpen] = useState(false);
  const [draftIds, setDraftIds] = useState<string[]>([]);
  const selectedStudents = selectableStudents.filter((s) => selectedIds.includes(s.id));
  const [state, setState] = useState<GpsState>("searching");
  const [distance, setDistance] = useState<number>(DISTANCE_SEQUENCE[0]);
  const [stepIndex, setStepIndex] = useState(0);
  const firedRef = useRef(false);
  const standbyNotifiedRef = useRef(false);

  // Simpan/muat ulang persistensi setiap kali selectedIds / autoMode berubah.
  useEffect(() => {
    if (autoMode && selectedIds.length > 0) {
      savePersisted(selectedIds);
    } else {
      clearPersisted();
    }
  }, [autoMode, selectedIds]);

  // Tangkap pergantian hari saat aplikasi dibuka (mis. semalaman dibiarkan terbuka).
  useEffect(() => {
    const onVisible = () => {
      const persisted = loadPersisted();
      // Hari berganti → mati otomatis.
      if (autoMode && persisted === null) {
        setAutoMode(false);
        setSelectedIds([]);
        firedRef.current = false;
        setState("searching");
        setStepIndex(0);
        setDistance(DISTANCE_SEQUENCE[0]);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMode]);

  // initial GPS "search"
  useEffect(() => {
    if (!autoMode) return;
    if (state !== "searching") return;
    const t = setTimeout(() => {
      setState("outside");
      appendTimeline("Lokasi berhasil ditemukan", "verified");
    }, 1800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMode, state]);

  // distance progression when tracking
  useEffect(() => {
    if (!autoMode) return;
    if (state === "searching" || state === "unavailable") return;
    if (state === "arrived" || state === "standby") return;

    const t = setTimeout(() => {
      const next = Math.min(stepIndex + 1, DISTANCE_SEQUENCE.length - 1);
      const nextD = DISTANCE_SEQUENCE[next];
      setStepIndex(next);
      setDistance(nextD);
      if (nextD === 0) {
        setState("arrived");
      } else if (nextD <= 200) {
        setState("approaching");
      } else {
        setState("outside");
      }
    }, 2200);
    return () => clearTimeout(t);
  }, [stepIndex, state, autoMode]);

  // Saat tiba (masuk radius): jika belum jam pulang → stand-by, baru panggil setelah jam pulang.
  useEffect(() => {
    if (!autoMode) return;
    if (state === "arrived" || state === "standby") {
      // Cek apakah sudah lewat jam kepulangan untuk semua siswa terpilih.
      const allPast = selectedStudents.every((s) => isPastDismissalTime(s.dismissalTime));
      const blocking = pickupBlockReason() !== null;

      if (blocking) {
        // Hari tutup — jangan panggil.
        return;
      }

      if (!allPast) {
        // Belum jam pulang → tetap di status tiba, tapi masuk mode stand-by.
        setState("standby");
        if (!standbyNotifiedRef.current) {
          standbyNotifiedRef.current = true;
          appendTimeline("Sampai sekolah · menunggu jam kepulangan", "verified");
          toast.info("Sudah sampai sekolah", {
            description: "Ananda menunggu jam kepulangan sebelum dipanggil otomatis.",
          });
        }
        return;
      }

      // Sudah lewat jam pulang → jalankan pemanggilan otomatis.
      if (firedRef.current) return;
      firedRef.current = true;
      runAutoCall(selectedStudents);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, autoMode, selectedStudents]);

  // Watchdog: saat stand-by, cek setiap menit hingga jam pulang tercapai, lalu panggil.
  useEffect(() => {
    if (!autoMode || state !== "standby") return;
    if (selectedStudents.length === 0) return;

    const allPast = selectedStudents.every((s) => isPastDismissalTime(s.dismissalTime));
    if (allPast && !firedRef.current) {
      firedRef.current = true;
      runAutoCall(selectedStudents);
      return;
    }

    const t = setInterval(() => {
      const past = selectedStudents.every((s) => isPastDismissalTime(s.dismissalTime));
      if (past && !firedRef.current) {
        firedRef.current = true;
        runAutoCall(selectedStudents);
        clearInterval(t);
      }
    }, 60_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, autoMode, selectedStudents]);

  function runAutoCall(studentsToCall: typeof selectedStudents) {
    appendTimeline("Memasuki radius sekolah", "verified");
    const steps: { at: number; label: string; stage: PickupStage }[] = [
      { at: 600, label: "Radius terdeteksi", stage: "verified" },
      { at: 1400, label: "Permintaan dibuat otomatis", stage: "processed" },
      { at: 2200, label: "Data terkirim ke sistem", stage: "processed" },
      { at: 3000, label: "Menunggu verifikasi petugas", stage: "queued" },
    ];
    const names = studentsToCall.map((s) => s.nickname).join(", ");
    const timers = steps.map((s) =>
      setTimeout(() => appendTimeline(s.label, s.stage), s.at),
    );
    timers.push(
      setTimeout(() => {
        appendTimeline("Pemanggilan diumumkan", "announcing");
        toast.success("Ananda sudah dipanggil", {
          description: names ? `${names} dipanggil melalui speaker sekolah.` : undefined,
        });
      }, 3800),
    );
    return () => timers.forEach(clearTimeout);
  }

  function retry() {
    firedRef.current = false;
    standbyNotifiedRef.current = false;
    setStepIndex(0);
    setDistance(DISTANCE_SEQUENCE[0]);
    setState("searching");
  }

  function openSheet() {
    setDraftIds(selectedIds);
    setSheetOpen(true);
  }

  function confirmSheet() {
    if (draftIds.length === 0) return;
    setSelectedIds(draftIds);
    setSheetOpen(false);
    retry();
    setAutoMode(true);
  }

  function disableAutoMode() {
    setAutoMode(false);
    setSelectedIds([]);
    clearPersisted();
    retry();
  }

  function simulateUnavailable() {
    setState("unavailable");
  }

  const tone = TONE[state];
  const pct = useMemo(() => {
    const max = DISTANCE_SEQUENCE[0];
    return Math.max(0, Math.min(1, 1 - distance / max));
  }, [distance]);

  const firstStudent = current ? students.find((s) => s.id === current.studentIds[0]) : null;
  const dismissed = firstStudent?.dismissStatus === "sudah";

  function handleToggle(v: boolean) {
    if (!v) {
      disableAutoMode();
      return;
    }
    if (pickupBlockReason() !== null) {
      setClosedOpen(true);
      return;
    }
    openSheet();
  }

  return (
    <div className="mx-5 mt-5 space-y-4">
      {/* Safety banner */}
      <SafetyBanner dismissed={dismissed} studentName={firstStudent?.nickname ?? "Siswa"} />
      {/* Satu kartu: area GPS (muncul saat toggle aktif) + baris toggle */}
      <div
        className={cn(
          "relative overflow-hidden rounded-3xl border border-border p-4 shadow-card transition-colors duration-500",
          autoMode ? cn("bg-gradient-to-br", tone.bg) : "bg-surface",
        )}
      >
        {autoMode && (
          <div className="animate-fade-in px-1 pb-4 pt-1">
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <Radar state={state} pct={pct} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", tone.chip)}>
                    <StateIcon state={state} />
                    {tone.label}
                  </span>
                </div>
                <h3 className={cn("mt-2 font-display text-base font-bold leading-tight", tone.text)}>
                  {titleFor(state)}
                </h3>

                {(state === "outside" || state === "approaching") && (
                  <div className="mt-2">
                    <div className="flex items-end justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Jarak ke sekolah</span>
                      <span className={cn("font-display text-xl font-bold tabular-nums", tone.text)}>
                        {formatDistance(distance)}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className={cn("h-full rounded-full transition-all duration-700", state === "approaching" ? "bg-accent" : "bg-primary")}
                        style={{ width: `${pct * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {state === "searching" && (
                  <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Mengambil sinyal GPS…</span>
                  </div>
                )}

                {state === "standby" && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 rounded-2xl bg-info/15 px-3 py-2 text-[11px] font-semibold text-info-foreground">
                      <Hourglass className="h-4 w-4 animate-pulse" />
                      Anda sudah sampai sekolah, tapi belum jam kepulangan. Ananda akan dipanggil otomatis setelah jam pulang.
                    </div>
<p className="text-[11px] text-muted-foreground">
                      Jam pulang hari ini:{" "}
                      {selectedStudents.map((s) => s.dismissalTime).filter(Boolean).join(" / ") || "—"} · WIB sekarang{" "}
                      {(() => { const w = nowWIB(); return `${String(w.hours).padStart(2, "0")}.${String(w.minutes).padStart(2, "0")}`; })()}
                    </p>
                  </div>
                )}

                {state === "unavailable" && (
                  <div className="mt-3 space-y-2">
                    <ul className="space-y-1 text-[11px] text-muted-foreground">
                      <li className="flex items-center gap-2"><MapPin className="h-3 w-3" /> GPS aktif</li>
                      <li className="flex items-center gap-2"><ShieldAlert className="h-3 w-3" /> Izin lokasi diberikan</li>
                      <li className="flex items-center gap-2"><Wifi className="h-3 w-3" /> Internet tersedia</li>
                    </ul>
                    <button
                      onClick={retry}
                      className="inline-flex items-center gap-1.5 rounded-full bg-warning px-3 py-1.5 text-[11px] font-bold text-warning-foreground shadow-card active:scale-95"
                    >
                      <RefreshCw className="h-3 w-3" /> Coba Lagi
                    </button>
                  </div>
                )}

                {state === "arrived" && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 rounded-2xl bg-success/15 px-3 py-2 text-[11px] font-semibold text-success-foreground">
                      <CheckCircle2 className="h-4 w-4 animate-pop" />
                      Ananda sudah dipanggil melalui speaker sekolah.
                    </div>
                    <Link
                      to="/monitoring"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground shadow-card transition active:scale-95"
                    >
                      <Megaphone className="h-4 w-4" /> Lihat Halaman Pemanggilan
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className={cn("rounded-3xl", autoMode && "bg-surface p-4 shadow-card")}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "grid h-11 w-11 shrink-0 place-items-center rounded-2xl transition",
              autoMode ? "bg-primary/10 text-primary" : "bg-surface-2 text-muted-foreground",
            )}>
              <Navigation className={cn("h-5 w-5 transition", autoMode && "animate-pulse")} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-bold text-ink">Panggil Otomatis</p>
              <p className="text-[11px] text-muted-foreground">
                {autoMode ? "Aktif untuk anak yang dipilih." : "Matikan jika ingin memanggil secara manual."}
              </p>
            </div>
            <Switch
              checked={autoMode}
              onCheckedChange={handleToggle}
              className="h-6 w-11 shrink-0 data-[state=checked]:bg-primary [&>span]:h-5 [&>span]:w-5 [&>span]:data-[state=checked]:translate-x-5"
            />
          </div>

          {autoMode && selectedStudents.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {selectedStudents.map((s) => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary"
                >
                  <Users className="h-3 w-3" /> {s.nickname}
                </span>
              ))}
              <button
                type="button"
                onClick={openSheet}
                className="rounded-full border border-border px-2.5 py-1 text-[10px] font-bold text-muted-foreground active:scale-95"
              >
                Ubah
              </button>
            </div>
          )}

          <p className={cn(
            "mt-3 rounded-2xl px-3 py-2 text-[11px] leading-relaxed transition",
            autoMode ? "bg-surface-2 text-muted-foreground" : "bg-warning/15 text-warning-foreground",
          )}>
            {autoMode
              ? "Tetap aktif sepanjang hari (bahkan saat browser ditutup). Ananda otomatis dipanggil setelah jam kepulangan saat Anda memasuki radius sekolah."
              : "Mode lokasi dimatikan. Anda harus melakukan pemanggilan secara manual menggunakan tombol di bawah."}
          </p>
        </div>
      </div>

      <BottomSheet
        open={sheetOpen}
        title="Pilih anak yang dijemput"
        description="Wajib pilih minimal satu anak sebelum Panggil Otomatis diaktifkan."
        onClose={() => setSheetOpen(false)}
        footer={
          <button
            type="button"
            disabled={draftIds.length === 0}
            onClick={confirmSheet}
            className={cn(
              "w-full rounded-2xl px-4 py-3.5 text-sm font-bold transition active:scale-95",
              draftIds.length === 0
                ? "bg-surface-2 text-muted-foreground"
                : "bg-primary text-primary-foreground shadow-card",
            )}
          >
            {draftIds.length === 0 ? "Pilih anak dulu" : `Aktifkan untuk ${draftIds.length} anak`}
          </button>
        }
      >
        <ul className="space-y-2">
          {selectableStudents.map((s) => {
            const active = draftIds.includes(s.id);
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() =>
                    setDraftIds((p) => (p.includes(s.id) ? p.filter((x) => x !== s.id) : [...p, s.id]))
                  }
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.98]",
                    active ? "border-primary bg-primary/5" : "border-border bg-surface-2",
                  )}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface font-display text-sm font-bold text-ink">
                    {s.name[0]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-sm font-bold text-ink">{s.name}</span>
                    <span className="block text-[11px] text-muted-foreground">Kelas {s.className}</span>
                  </span>
                  <span
                    className={cn(
                      "grid h-6 w-6 shrink-0 place-items-center rounded-full border transition",
                      active ? "border-primary bg-primary text-primary-foreground" : "border-border",
                    )}
                  >
                    {active && <CheckCircle2 className="h-4 w-4" />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </BottomSheet>

      <BottomSheet
        open={closedOpen}
        title="Pemanggilan otomatis belum tersedia"
        description="Panggil Otomatis (GPS) tidak dapat diaktifkan saat ini."
        onClose={() => setClosedOpen(false)}
        footer={
          <button
            type="button"
            onClick={() => setClosedOpen(false)}
            className="w-full rounded-2xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground shadow-card transition active:scale-95"
          >
            Mengerti
          </button>
        }
      >
        <div className="space-y-3">
          {pickupBlockReason() === "off" ? (
            <div className="rounded-2xl bg-warning/15 px-4 py-3 text-xs leading-relaxed text-warning-foreground">
              Layanan pemanggilan penjemputan sedang dinonaktifkan oleh pihak sekolah untuk sementara waktu, sehingga
              Panggil Otomatis (GPS) tidak dapat diaktifkan.
            </div>
          ) : (
            <div className="rounded-2xl bg-warning/15 px-4 py-3 text-xs leading-relaxed text-warning-foreground">
              Layanan pemanggilan penjemputan sudah melewati batas waktu hari ini. Anda tidak dapat mengaktifkan
              Panggil Otomatis (GPS) hingga hari berikutnya.
            </div>
          )}
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Anda dapat menghubungi Admin Penjemputan sekolah jika memerlukan bantuan lebih lanjut.
          </p>
        </div>
      </BottomSheet>

    </div>

  );
}

function StateIcon({ state }: { state: GpsState }) {
  const cls = "h-3 w-3";
  if (state === "searching") return <Loader2 className={cn(cls, "animate-spin")} />;
  if (state === "arrived") return <CheckCircle2 className={cls} />;
  if (state === "standby") return <Hourglass className={cn(cls, "animate-pulse")} />;
  if (state === "unavailable") return <AlertTriangle className={cls} />;
  return <MapPin className={cls} />;
}

function titleFor(state: GpsState) {
  return {
    searching: "Sedang mencari lokasi…",
    outside: "Anda berada di luar radius sekolah",
    approaching: "Anda hampir tiba",
    arrived: "Anda telah memasuki area sekolah",
    standby: "Sudah sampai · menunggu jam kepulangan",
    unavailable: "Lokasi tidak tersedia",
  }[state];
}

function descriptionFor(state: GpsState) {
  return {
    searching: "",
    outside: "",
    approaching: "",
    arrived: "",
    standby: "",
    unavailable: "",
  }[state];
}

function Radar({ state, pct }: { state: GpsState; pct: number }) {
  const glow = 0.35 + pct * 0.65;
  const size = 96;
  return (
    <div
      className={cn("relative grid place-items-center rounded-full", state === "arrived" && "text-success-foreground")}
      style={{ width: size, height: size }}
    >
      <div className={cn(
        "absolute inset-0 rounded-full border border-primary/20 animate-radar",
        state === "arrived" && "border-success/40",
        state === "standby" && "border-info/40",
        state === "unavailable" && "border-warning/40",
      )} />
      <div className={cn(
        "absolute inset-2 rounded-full border border-primary/30 animate-radar [animation-delay:400ms]",
        state === "arrived" && "border-success/50",
        state === "standby" && "border-info/50",
        state === "unavailable" && "border-warning/50",
      )} />
      <div className={cn(
        "absolute inset-4 rounded-full border border-primary/40 animate-radar [animation-delay:800ms]",
        state === "arrived" && "border-success/60",
        state === "standby" && "border-info/60",
        state === "unavailable" && "border-warning/60",
      )} />
      <div
        className={cn(
          "relative grid h-10 w-10 place-items-center rounded-full text-white shadow-glow transition-all",
          state === "arrived" ? "bg-success" : state === "standby" ? "bg-info" : state === "unavailable" ? "bg-warning" : "bg-primary",
        )}
        style={{ boxShadow: `0 0 ${12 + glow * 20}px hsl(var(--primary) / ${glow})` }}
      >
        <MapPin className="h-5 w-5" />
      </div>
    </div>
  );
}

function SafetyBanner({ dismissed, studentName }: { dismissed: boolean; studentName: string }) {
  return (
    <div>
      {dismissed
}
    </div>
  );
}


function MonitoringSummary({
  state,
  autoMode,
  distance,
  dismissed,
}: {
  state: GpsState;
  autoMode: boolean;
  distance: number;
  dismissed: boolean;
}) {
  const rows: { label: string; value: string; tone: "success" | "warn" | "danger" }[] = [
    {
      label: "Status GPS",
      value: state === "unavailable" ? "Tidak tersedia" : state === "searching" ? "Mencari" : "Aktif",
      tone: state === "unavailable" ? "danger" : state === "searching" ? "warn" : "success",
    },
    {
      label: "Status Radius",
      value: state === "arrived" ? "" : state === "approaching" ? "Mendekati" : "Di luar",
      tone: state === "arrived" ? "success" : state === "approaching" ? "warn" : "danger",
    },
    { label: "Jarak ke sekolah", value: formatDistance(distance), tone: distance <= 200 ? "success" : "warn" },
    { label: "Mode Otomatis", value: autoMode ? "Aktif" : "Nonaktif", tone: autoMode ? "success" : "warn" },
    { label: "Presensi Pulang", value: dismissed ? "Sudah" : "Belum", tone: dismissed ? "success" : "warn" },
    { label: "Estimasi Panggilan", value: state === "arrived" ? "Segera" : distance <= 200 ? "< 1 mnt" : "Menunggu", tone: "warn" },
  ];
  return (
    <div className="rounded-3xl border border-border bg-surface p-4 shadow-card">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ringkasan</p>
      <div className="grid grid-cols-2 gap-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-2 rounded-2xl bg-surface-2 px-3 py-2">
            <span className={cn(
              "h-2 w-2 shrink-0 rounded-full",
              r.tone === "success" && "bg-success",
              r.tone === "warn" && "bg-accent",
              r.tone === "danger" && "bg-destructive",
            )} />
            <div className="min-w-0">
              <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{r.label}</p>
              <p className="truncate text-xs font-bold text-ink">{r.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function appendTimeline(label: string, stage: PickupStage) {
  const s = pickupStore.get();
  if (!s.current) return;
  const cur = s.current;
  // don't push if last entry has same label (avoid dupes on strict-mode double effect)
  if (cur.timeline.at(-1)?.label === label) return;
  pickupStore.set({
    current: {
      ...cur,
      timeline: [...cur.timeline, { at: nowHHmm(), label, stage }],
    },
  });
  void STAGE_ORDER;
}
