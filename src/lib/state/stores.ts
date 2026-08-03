import { useSyncExternalStore } from "react";

type Listener = () => void;

function createStore<T>(key: string, initial: T) {
  let state: T = initial;
  const listeners = new Set<Listener>();

  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) state = { ...initial, ...JSON.parse(raw) } as T;
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
      state = typeof updater === "function" ? (updater as (s: T) => T)(state) : { ...state, ...updater };
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
export type SessionState = { username: string | null; signedIn: boolean };
const sessionInitial: SessionState = { username: null, signedIn: false };
export const sessionStore = createStore<SessionState>("panggil.session", sessionInitial);
export const useSession = () =>
  useSyncExternalStore(sessionStore.subscribe, sessionStore.get, serverSnapshot(sessionInitial));

// ============ SETTINGS ============
export type SettingsState = { elderlyMode: boolean; darkMode: boolean; notifications: boolean };
const settingsInitial: SettingsState = { elderlyMode: false, darkMode: false, notifications: true };
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
};

export type ActivePickupState = { current: PickupRequest | null; history: PickupRequest[] };
const pickupInitial: ActivePickupState = { current: null, history: [] };
export const pickupStore = createStore<ActivePickupState>("panggil.pickup", pickupInitial);
export const useActivePickup = () =>
  useSyncExternalStore(pickupStore.subscribe, pickupStore.get, serverSnapshot(pickupInitial));

export const STAGE_LABELS: Record<PickupStage, string> = {
  received: "Permintaan diterima",
  verified: "Data diverifikasi",
  processed: "Data sedang diproses",
  generated: "Kalimat pemanggilan dibuat",
  queued: "Menunggu speaker tersedia",
  announcing: "Sedang dipanggil",
  done: "Pemanggilan selesai",
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
