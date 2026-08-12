import {
  pickupStore,
  STAGE_ORDER,
  type PickupStage,
  type PickupRequest,
  markStudentCalled,
  markStudentPickedUp,
} from "../state/stores";
import { nowHHmm } from "../format/utils";
import { getStudents } from "../students";
import { markPickupDone } from "./history";
import { persistRecall, type RecallSourceTable } from "@/lib/recall";
import { notify } from "@/lib/state/notificationStore";

function studentNames(studentIds: string[]) {
  return studentIds
    .map((id) => getStudents().find((student) => student.id === id)?.name)
    .filter(Boolean)
    .join(", ");
}

export function buildAnnouncement(
  req: Pick<PickupRequest, "studentIds" | "method" | "pickerName"> &
    Partial<Pick<PickupRequest, "note" | "noteExtras">>,
) {
  const students = getStudents();
  const names = req.studentIds
    .map((id) => students.find((s) => s.id === id)?.name)
    .filter(Boolean)
    .join(" dan Ananda ");
  const method =
    req.method === "self"
      ? "orang tua"
      : req.method === "other"
      ? req.pickerName || "penjemput"
      : "driver ojek online";
  const cls = students.find((s) => s.id === req.studentIds[0])?.className ?? "";
  const tail = [req.note?.trim(), ...(req.noteExtras ?? [])].filter(Boolean).join(" ");
  return `Kepada Ananda ${names} kelas ${cls}, dipersilakan menuju area penjemputan karena ${method} telah tiba.${
    tail ? ` ${tail}` : ""
  } Terima kasih.`;
}

const STAGE_DELAYS: Record<PickupStage, number> = {
  received: 0,
  verified: 1400,
  processed: 1600,
  generated: 1800,
  queued: 2200,
  announcing: 2600,
  done: 2400,
};

export function startSimulation(id: string) {
  const state = pickupStore.get();
  if (!state.current || state.current.id !== id) return;
  const startFromIndex = STAGE_ORDER.indexOf(state.current.stage);
  let cumulative = 0;
  for (let i = startFromIndex + 1; i < STAGE_ORDER.length; i++) {
    const stage = STAGE_ORDER[i];
    cumulative += STAGE_DELAYS[stage];
    setTimeout(() => {
      const s = pickupStore.get();
      if (!s.current || s.current.id !== id) return;
      const label = LABELS[stage];
      const timeline = [...s.current.timeline, { at: nowHHmm(), label, stage }];
      pickupStore.set({
        current: { ...s.current, stage, timeline },
      });
    }, cumulative);
  }
}

const LABELS: Record<PickupStage, string> = {
  received: "Permintaan diterima",
  verified: "Data berhasil diverifikasi",
  processed: "Data sedang diproses sistem",
  generated: "Kalimat pemanggilan dibuat",
  queued: "Menunggu speaker tersedia",
announcing: "Pengumuman sedang diputar",
  done: "Sedang dipanggil",
};

function makeQrCode() {
  const rand = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
  return `PJ-${rand}${String(Date.now()).slice(-3)}`;
}

export function submitPickup(input: Omit<PickupRequest, "id" | "createdAt" | "stage" | "timeline" | "announcement" | "cooldownStartedAt" | "secondCallExtras" | "callCount">) {
  const idPemanggilan = input.idPemanggilan ?? String(Date.now());
  const id = `req-${Date.now()}`;
  const req: PickupRequest = {
    ...input,
    id,
    idPemanggilan,
    createdAt: Date.now(),
    stage: "received",
    timeline: [{ at: nowHHmm(), label: LABELS.received, stage: "received" }],
    announcement: buildAnnouncement(input),
    qrCode: input.estimate === "qr" ? makeQrCode() : null,
    cooldownStartedAt: null,
    secondCallExtras: [],
    callCount: 1,
  };
pickupStore.set({ current: req, history: pickupStore.get().history });
  notify("Pemanggilan penjemputan dikirim", studentNames(req.studentIds) || "Permintaan penjemputan sedang diproses.", "success");
  markStudentCalled(req.studentIds, req.callCount);
  // Row Supabase sudah dibuat saat halaman form dibuka dan diselesaikan di
  // halaman ringkasan. Di sini hanya menjalankan pemanggilan lokal.
  if (!req.qrCode) startSimulation(id);
  return req;
}

export function completeAndStartCooldown() {
  const s = pickupStore.get();
  if (!s.current) return;
  pickupStore.set({
    current: { ...s.current, cooldownStartedAt: Date.now() },
  });
}

export function finishAndArchive() {
  const s = pickupStore.get();
  if (!s.current) return;
  markStudentPickedUp(s.current.studentIds);
  // Tandai selesai di riwayat Supabase (fire & forget).
  void markPickupDone(s.current);
  notify("Penjemputan selesai", studentNames(s.current.studentIds) || "Penjemputan telah disimpan ke riwayat.", "success");
  pickupStore.set({
    current: null,
    history: [{ ...s.current, stage: "done" as PickupStage }, ...s.history].slice(0, 20),
  });
}

/**
 * Menghentikan pemanggilan secara paksa (misal karena batas waktu WIB tercapai).
 * Pemanggilan diarsipkan ke riwayat dengan penanda "stopped", dan status aktif
 * dikosongkan sehingga halaman monitoring & popup kembali ke keadaan awal.
 */
export function forceStopActivePickup() {
  const s = pickupStore.get();
  if (!s.current) return;
// Tandai dihentikan di riwayat Supabase (fire & forget).
  void markPickupDone(s.current);
  const stopped = {
    ...s.current,
    stage: "done" as PickupStage,
    stopped: true,
    timeline: [
      ...s.current.timeline,
      { at: nowHHmm(), label: "Pemanggilan dihentikan (batas waktu tercapai)", stage: "done" as PickupStage },
    ],
  };
  pickupStore.set({
    current: null,
    history: [stopped, ...s.history].slice(0, 20),
  });
}

export async function triggerSecondCall(extras: string[], selectedIdPemanggilan?: string) {
  const s = pickupStore.get();
  if (!s.current) return;
  const req = s.current;
  const idPemanggilan = selectedIdPemanggilan ?? req.idPemanggilan;
  if (!idPemanggilan) throw new Error("Pilih ID pemanggilan sebelum melakukan recall.");
  const extraSentence = extras.length ? " " + extras.join(" ") : "";
  const nextAnnouncement = req.announcement + extraSentence;
  const sourceTable: RecallSourceTable = `panggil_${req.method}`;
  const recall = await persistRecall(sourceTable, idPemanggilan, nextAnnouncement);
  const nextCount = recall.pemanggilanKe;
  const updated = {
    ...req,
    callCount: nextCount,
    secondCallExtras: [...req.secondCallExtras, ...extras],
    cooldownStartedAt: null,
    stage: "queued" as PickupStage,
    announcement: nextAnnouncement,
    timeline: [
      ...req.timeline,
      { at: nowHHmm(), label: `Pemanggilan ulang #${nextCount}`, stage: "queued" as PickupStage },
    ],
  };
pickupStore.set({ current: updated });
  notify(`Pemanggilan ulang ke-${nextCount} dikirim`, studentNames(req.studentIds) || "Panggilan ulang sedang diumumkan.", "success");
  markStudentCalled(req.studentIds, nextCount);
  // simulate short queued -> announcing -> cooldown
  setTimeout(() => {
    const cur = pickupStore.get().current;
    if (!cur || cur.id !== req.id) return;
    pickupStore.set({
      current: {
        ...cur,
        stage: "announcing",
        timeline: [...cur.timeline, { at: nowHHmm(), label: LABELS.announcing, stage: "announcing" }],
      },
    });
  }, 1800);
  setTimeout(() => {
    const cur = pickupStore.get().current;
    if (!cur || cur.id !== req.id) return;
    pickupStore.set({
      current: {
        ...cur,
        stage: "done",
        cooldownStartedAt: Date.now(),
        timeline: [...cur.timeline, { at: nowHHmm(), label: LABELS.done, stage: "done" }],
      },
    });
  }, 4400);
}

export function simulateScan() {
  const s = pickupStore.get();
  if (!s.current) return;
  const req = s.current;
  const firstScan = (req.scanCount ?? 0) === 0;
  pickupStore.set({
    current: {
      ...req,
      scanCount: (req.scanCount ?? 0) + 1,
      lastScannedAt: Date.now(),
      timeline: [
        ...req.timeline,
        { at: nowHHmm(), label: "Kode QR dipindai petugas gerbang", stage: req.stage },
      ],
    },
  });

  // Pemindaian pertama memicu antrean pemanggilan sampai selesai.
  if (!firstScan) return;
  const steps: { stage: PickupStage; delay: number }[] = [
    { stage: "queued", delay: 900 },
    { stage: "announcing", delay: 2200 },
    { stage: "done", delay: 4200 },
  ];
  for (const step of steps) {
    setTimeout(() => {
      const cur = pickupStore.get().current;
      if (!cur || cur.id !== req.id) return;
      pickupStore.set({
        current: {
          ...cur,
          stage: step.stage,
          timeline: [...cur.timeline, { at: nowHHmm(), label: LABELS[step.stage], stage: step.stage }],
        },
      });
    }, step.delay);
  }
}

export function resetScans() {
  const s = pickupStore.get();
  if (!s.current) return;
  pickupStore.set({ current: { ...s.current, scanCount: 0, lastScannedAt: null } });
}
