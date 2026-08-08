import { useSyncExternalStore } from "react";

type Listener = () => void;

export function createStore<T>(key: string, initial: T) {
  let state: T = initial;
  const listeners = new Set<Listener>();

  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(key);
if (raw) {
        const parsed = JSON.parse(raw) as T;
        if (Array.isArray(initial)) {
          // Array state harus dipertahankan sebagai array. Jika data korup (bukan array), fallback ke initial.
          state = (Array.isArray(parsed) ? parsed : initial) as T;
        } else {
          state = { ...initial, ...(parsed as object) } as T;
        }
      }
    } catch {}
  }

  const persist = () => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  };

  return {
    get: () => state,
    set: (updater: Partial<T> | ((s: T) => T)) => {
      if (typeof updater === "function") {
        state = (updater as (s: T) => T)(state);
      } else if (Array.isArray(state)) {
        // Array state diganti utuh (bukan di-spread jadi objek).
        state = updater as T;
      } else {
        state = { ...state, ...(updater as object) } as T;
      }
      persist();
      listeners.forEach((l) => l());
    },
    subscribe: (l: Listener) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}

function serverSnapshot<T>(initial: T) {
  return () => initial;
}

// ============ SESSION ============
export type SessionState = { username: string | null; namaWalmur: string | null; signedIn: boolean };
const sessionInitial: SessionState = { username: null, namaWalmur: null, signedIn: false };
export const sessionStore = createStore<SessionState>("panggil.session", sessionInitial);
export const useSession = () =>
  useSyncExternalStore(sessionStore.subscribe, sessionStore.get, serverSnapshot(sessionInitial));

// ============ SETTINGS ============
export type TextScale = "normal" | "besar" | "sangat-besar";
export type SettingsState = {
  elderlyMode: boolean;
  darkMode: boolean;
  notifications: boolean;
  textScale: TextScale;
  highContrast: boolean;
  reduceMotion: boolean;
};
const settingsInitial: SettingsState = {
  elderlyMode: false,
  darkMode: false,
  notifications: true,
  textScale: "normal",
  highContrast: false,
  reduceMotion: false,
};
export const settingsStore = createStore<SettingsState>("panggil.settings", settingsInitial);
export const useSettings = () =>
  useSyncExternalStore(settingsStore.subscribe, settingsStore.get, serverSnapshot(settingsInitial));

// ============ ACTIVE PICKUP ============
export type PickupStage =
  | "received"
  | "verified"
  | "processed"
  | "generated"
  | "queued"
  | "announcing"
  | "done";

export type TimelineEntry = { at: string; label: string; stage: PickupStage };

export type PickupRequest = {
  id: string;
  studentIds: string[];
  method: "self" | "other" | "ojek";
  note: string;
  noteExtras?: string[];
  estimate: string;
  qrCode?: string | null;
  waitLocation?: string;
  pickerName?: string;
  relation?: string;
  driverName?: string;
  platform?: string;
  plate?: string;
  createdAt: number;
  stage: PickupStage;
  timeline: TimelineEntry[];
  announcement: string;
  cooldownStartedAt: number | null;
  secondCallExtras: string[];
callCount: number;
  scanCount?: number;
  lastScannedAt?: number | null;
  /** True jika pemanggilan dihentikan paksa otomatis (batas waktu WIB tercapai). */
  stopped?: boolean;
};

export type ActivePickupState = { current: PickupRequest | null; history: PickupRequest[] };
const pickupInitial: ActivePickupState = { current: null, history: [] };
export const pickupStore = createStore<ActivePickupState>("panggil.pickup", pickupInitial);
export const useActivePickup = () =>
  useSyncExternalStore(pickupStore.subscribe, pickupStore.get, serverSnapshot(pickupInitial));

// ============ STUDENT PICKUP STATUS (real-time) ============
// Melacak status "dijemput" & jumlah panggilan per siswa secara real-time.
export type StudentPickupStatus = {
  callCount: number;
  dismissed: boolean;
};
export type StudentStatusMap = Record<string, StudentPickupStatus>;
const studentStatusInitial: StudentStatusMap = {};
export const studentStatusStore = createStore<StudentStatusMap>("panggil.studentStatus", studentStatusInitial);
export const useStudentStatus = () =>
  useSyncExternalStore(studentStatusStore.subscribe, studentStatusStore.get, serverSnapshot(studentStatusInitial));

export function markStudentCalled(studentIds: string[], callCount: number) {
  const s = studentStatusStore.get();
  const next = { ...s };
  for (const id of studentIds) {
    next[id] = { callCount, dismissed: next[id]?.dismissed ?? false };
  }
  studentStatusStore.set(next);
}

export function markStudentPickedUp(studentIds: string[]) {
  const s = studentStatusStore.get();
  const next = { ...s };
  for (const id of studentIds) {
    next[id] = { callCount: next[id]?.callCount ?? 0, dismissed: true };
  }
  studentStatusStore.set(next);
}

export const STAGE_LABELS: Record<PickupStage, string> = {
  received: "Permintaan diterima",
  verified: "Data diverifikasi",
  processed: "Data sedang diproses",
  generated: "Kalimat pemanggilan dibuat",
  queued: "Menunggu speaker tersedia",
announcing: "Sedang dipanggil",
  done: "Sedang Proses Pemanggilan",
};

export const STAGE_ORDER: PickupStage[] = [
  "received",
  "verified",
  "processed",
  "generated",
  "queued",
  "announcing",
  "done",
];
