import { useSyncExternalStore } from "react";
import { createStore } from "@/lib/state/stores";

/**
 * FITUR "PANGGIL" — DITUNGGU & AMBIL TITIPAN
 * -----------------------------------------
 * Store lokal untuk melacak permintaan aktif selain penjemputan:
 *   - `ditunggu` : panggil siswa karena seseorang menunggu
 *   - `titipan`  : panggil siswa karena ada titipan untuk diambil
 *
 * Backend (INSERT ke tabel Supabase `panggil_ditunggu` / `panggil_titipan`)
 * menyusul di tahap berikutnya. Untuk sekarang UI/UX berjalan penuh dengan
 * penyimpanan lokal agar dashboard bisa menampilkan status selesai/taken.
 */

export type CallType = "ditunggu" | "titipan";

export type CallKindPayload =
  | {
      type: "ditunggu";
      studentIds: string[];
      ditungguOleh: string;
      posisiTunggu: string;
      shortMessg: string;
    }
  | {
      type: "titipan";
      studentIds: string[];
      namaPenitip: string;
      jenisTitipan: string;
      shortMessg: string;
    };

export type ActiveCall = {
  id: string;
  type: CallType;
  studentIds: string[];
  createdAt: number;
  /** true untuk titipan → sudah diambil; untuk ditunggu → selesai. */
  done: boolean;
  /** Khusus titipan: "sudah diambil" / "belum diambil". */
  taken?: boolean;
  payload: CallKindPayload;
};

export type CallStoreState = {
  current: ActiveCall | null;
  history: ActiveCall[];
};

const callInitial: CallStoreState = { current: null, history: [] };
export const callStore = createStore<CallStoreState>("panggil.call", callInitial);
export const useActiveCall = () =>
  useSyncExternalStore(callStore.subscribe, callStore.get, () => callInitial);

export function createCall(payload: CallKindPayload): ActiveCall {
  const id = `call-${Date.now()}`;
  const call: ActiveCall = {
    id,
    type: payload.type,
    studentIds: payload.studentIds,
    createdAt: Date.now(),
    done: false,
    taken: payload.type === "titipan" ? false : undefined,
    payload,
  };
  const s = callStore.get();
  callStore.set({ current: call, history: [call, ...s.history].slice(0, 20) });
  return call;
}

/** Tandai selesai / sudah diambil. */
export function completeCall(id: string) {
  const s = callStore.get();
  if (!s.current || s.current.id !== id) return;
  callStore.set({
    current: { ...s.current, done: true, taken: s.current.type === "titipan" ? true : undefined },
    history: s.history.map((c) =>
      c.id === id
        ? { ...c, done: true, taken: c.type === "titipan" ? true : c.taken }
        : c,
    ),
  });
}

/** Kosongkan permintaan aktif. */
export function clearActiveCall() {
  const s = callStore.get();
  callStore.set({ current: null, history: s.history });
}
