import { useEffect, useMemo, useRef, useState } from "react";
import { Switch } from "@/components/ui/switch";
import {
  MapPin,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Radio,
  Wifi,
  ShieldAlert,
  X,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { pickupStore, useActivePickup, STAGE_ORDER, type PickupStage } from "@/lib/state/stores";
import { nowHHmm } from "@/lib/format/utils";
import { students } from "@/lib/dummy/data";

type GpsState = "searching" | "outside" | "approaching" | "arrived" | "unavailable";

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
  unavailable: {
    ring: "ring-warning/50",
    text: "text-warning-foreground",
    bg: "from-warning/25 to-warning/10",
    chip: "bg-warning/25 text-warning-foreground",
    label: "Tidak tersedia",
  },
};

export function AutoPickupGeofence() {
  const { current } = useActivePickup();
  const [autoMode, setAutoMode] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [state, setState] = useState<GpsState>("searching");
  const [distance, setDistance] = useState<number>(DISTANCE_SEQUENCE[0]);
  const [stepIndex, setStepIndex] = useState(0);
  const firedRef = useRef(false);

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
    if (state === "searching" || state === "unavailable" || state === "arrived") return;

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

  // when arriving with auto mode, run smart auto call sequence
  useEffect(() => {
    if (!autoMode) return;
    if (state !== "arrived" || firedRef.current) return;
    firedRef.current = true;

    appendTimeline("Memasuki radius sekolah", "verified");
    if (!autoMode) return;
    const steps: { at: number; label: string; stage: PickupStage }[] = [
      { at: 600, label: "Radius terdeteksi", stage: "verified" },
      { at: 1400, label: "Permintaan dibuat otomatis", stage: "processed" },
      { at: 2200, label: "Data terkirim ke sistem", stage: "processed" },
      { at: 3000, label: "Menunggu verifikasi petugas", stage: "queued" },
    ];
    const timers = steps.map((s) =>
      setTimeout(() => appendTimeline(s.label, s.stage), s.at),
    );
    return () => timers.forEach(clearTimeout);
  }, [state, autoMode]);

  function retry() {
    firedRef.current = false;
    setStepIndex(0);
    setDistance(DISTANCE_SEQUENCE[0]);
    setState("searching");
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

  return (
    <div className="mx-5 mt-5 space-y-4">
      {/* Safety banner */}
      <SafetyBanner dismissed={dismissed} studentName={firstStudent?.nickname ?? "Siswa"} />
{/* Pickup detection card */}
      <div className={cn(
        "relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br p-5 shadow-card",
        tone.bg,
      )}>
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <Radar state={state} pct={pct} />
          </div>
          <div className=" ml-[-5px] min-w-0 flex-1">
            <div className="ml-[-5px] flex items-center gap-2">
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", tone.chip)}>
                <StateIcon state={state} />
                {tone.label}
              </span>
            </div>
            <h3 className={cn("mt-2 ml-[-5px] font-display text-base font-bold leading-tight", tone.text)}>
              {titleFor(state)}
            </h3>
            <p className="mt-1 ml-[-5px] text-[11px] leading-relaxed text-muted-foreground">
              {descriptionFor(state)}
            </p>

            {(state === "outside" || state === "approaching") && (
              <div className="mt-1 ml-[-5px]">
                <div className="flex items-end justify-between">
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
              <div className="mt-3 ml-[-5px] flex items-center gap-2 text-[11px] text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Mengambil sinyal GPS…</span>
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
              <div className="mt-3 ml-[-10px] flex items-center gap-2 rounded-sm bg-success/15 px-3 py-2 text-[11px] font-semibold text-success-foreground">
                <CheckCircle2 className="h-4 w-4 animate-pop" />
                Sistem mengirim permintaan pemanggilan otomatis.
              </div>
            )}
           
          </div>
        </div>
 {/* Auto pickup toggle card */}
      <div className="mt-5 rounded-3xl border border-border bg-surface p-4 shadow-card">
        <div className="flex items-center gap-3">
          <div className={cn(
            "grid h-11 w-11 place-items-center rounded-2xl transition",
            autoMode ? "bg-primary/10 text-primary" : "bg-surface-2 text-muted-foreground",
          )}>
            <Navigation className={cn("h-5 w-5 transition", autoMode && "animate-pulse")} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-bold text-ink">Panggil Otomatis</p>
            <p className="text-[11px] text-muted-foreground">Matikan jika ingin memanggil secara manual.</p>
          </div>
          <Switch
            checked={autoMode}
            onCheckedChange={setAutoMode}
            className="h-6 w-11 data-[state=checked]:bg-primary [&>span]:h-5 [&>span]:w-5 [&>span]:data-[state=checked]:translate-x-5"
          />
        </div>
        <p className={cn(
          "mt-3 rounded-2xl px-3 py-2 text-[11px] leading-relaxed transition",
          autoMode ? "bg-primary/5 text-primary" : "bg-warning/15 text-warning-foreground",
        )}>
          {autoMode
            ? "Saat Anda memasuki radius sekolah, sistem akan mengirim permintaan penjemputan secara otomatis."
            : "Mode lokasi dimatikan. Anda harus melakukan pemanggilan secara manual menggunakan tombol di bawah."}
        </p>
      </div>
        {/* dev helper 
        {state !== "unavailable" && state !== "arrived" && (
          <button
            onClick={simulateUnavailable}
            className="absolute right-3 top-3 text-[10px] font-semibold text-muted-foreground/60 hover:text-muted-foreground"
          >
            Simulasi error
          </button>
        )}*/}
      </div>
      

      

      {/* Monitoring summary 
      <MonitoringSummary state={state} autoMode={autoMode} distance={distance} dismissed={dismissed} />*/}
    </div>
  );
}

function StateIcon({ state }: { state: GpsState }) {
  const cls = "h-3 w-3";
  if (state === "searching") return <Loader2 className={cn(cls, "animate-spin")} />;
  if (state === "arrived") return <CheckCircle2 className={cls} />; 
  if (state === "unavailable") return <AlertTriangle className={cls} />;
  return <MapPin className={cls} />;
}

function titleFor(state: GpsState) {
  return {
    searching: "Sedang mencari lokasi…",
    outside: "Anda berada di luar radius sekolah",
    approaching: "Anda hampir tiba",
    arrived: "Anda telah memasuki area sekolah",
    unavailable: "Lokasi tidak tersedia",
  }[state];
}

function descriptionFor(state: GpsState) {
  return {
    searching: "",
    outside: "",
    approaching: "",
    arrived: "",
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
        state === "unavailable" && "border-warning/40",
      )} />
      <div className={cn(
        "absolute inset-2 rounded-full border border-primary/30 animate-radar [animation-delay:400ms]",
        state === "arrived" && "border-success/50",
        state === "unavailable" && "border-warning/50",
      )} />
      <div className={cn(
        "absolute inset-4 rounded-full border border-primary/40 animate-radar [animation-delay:800ms]",
        state === "arrived" && "border-success/60",
        state === "unavailable" && "border-warning/60",
      )} />
      <div
        className={cn(
          "relative grid h-10 w-10 place-items-center rounded-full text-white shadow-glow transition-all",
          state === "arrived" ? "bg-success" : state === "unavailable" ? "bg-warning" : "bg-primary",
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
    <div
      className={cn(
        "rounded-3xl border p-4 text-xs leading-relaxed shadow-card",
        dismissed
          ? "border-success/30 bg-success/10 text-success-foreground"
          : "border-warning/40 bg-warning/15 text-warning-foreground",
      )}
    >
      {dismissed
        ? `${studentName} sudah presensi pulang dan siap dijemput.`
        : `${studentName} belum presensi pulang. Panggilan akan diproses setelah presensi.`}
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
