import { useSyncExternalStore } from "react";
import { createStore } from "@/lib/state/stores";
import { insertCallHistory, updateCallCallCount, markCallDone, kataPanggilanFrom } from "@/lib/call/history";

/**
 * FITUR "PANGGIL" — DITUNGGU & AMBIL TITIPAN
 * -----------------------------------------
 * Store lokal untuk melacak permintaan aktif selain penjemputan:
 *   - `ditunggu` : panggil siswa karena seseorang menunggu
 *   - `titipan`  : panggil siswa karena ada titipan untuk diambil
 *
 * Backend: INSERT ke tabel Supabase `panggil_ditunggu` / `panggil_titipan`
 * (lihat `src/lib/call/history.ts`). Cooldown 3 menit dibatasi antar recall.
 */

export type CallType = "ditunggu" | "titipan";

export type CallKindPayload =
  | {
      type: "ditunggu";
      studentIds: string[];
      ditungguOleh: string;
      posisiTunggu: string;
      shortMessg: string;
      method: string;
    }
  | {
      type: "titipan";
      studentIds: string[];
      namaPenitip: string;
      jenisTitipan: string;
      shortMessg: string;
      method: string;
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
  /** Kalimat lengkap yang dipanggilkan (kata_panggilan). */
  announcement: string;
  /** ID record riwayat Supabase hasil INSERT pertama — dipakai recall/done. */
  idPemanggilan?: string;
  /** Berapa kali sudah dipanggil. */
  callCount: number;
  /** Timestamp mulainya cooldown 3 menit (null = belum/sedang tidak cooldown). */
  cooldownStartedAt: number | null;
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
    announcement: kataPanggilanFrom({
      id,
      type: payload.type,
      studentIds: payload.studentIds,
      createdAt: Date.now(),
      done: false,
      taken: payload.type === "titipan" ? false : undefined,
      payload,
      announcement: "",
      callCount: 1,
      cooldownStartedAt: null,
    }),
    callCount: 1,
    cooldownStartedAt: Date.now(),
  };
  const s = callStore.get();
  callStore.set({ current: call, history: [call, ...s.history].slice(0, 20) });
  // Simpan riwayat ke Supabase (fire & forget — tidak menghentikan alur utama).
  void insertCallHistory(call);
  return call;
}

/** Tandai selesai / sudah diambil. */
export function completeCall(id: string) {
  const s = callStore.get();
  if (!s.current || s.current.id !== id) return;
  const updated = {
    ...s.current,
    done: true,
    taken: s.current.type === "titipan" ? true : undefined,
  };
  callStore.set({
    current: updated,
    history: s.history.map((c) =>
      c.id === id
        ? { ...c, done: true, taken: c.type === "titipan" ? true : c.taken }
        : c,
    ),
  });
  // Tandai done di riwayat Supabase (fire & forget).
  void markCallDone(updated);
}

/** Kosongkan permintaan aktif. */
export function clearActiveCall() {
  const s = callStore.get();
  callStore.set({ current: null, history: s.history });
}

/** Mulai hitung mundur cooldown 3 menit (dipanggil saat panggilan pertama dibuat / recall). */
export function completeAndStartCooldown() {
  const s = callStore.get();
  if (!s.current) return;
  callStore.set({
    current: { ...s.current, cooldownStartedAt: Date.now() },
  });
}

/**
 * Recall / panggil ulang — menambah jumlah_pemanggilan, reset cooldown,
 * dan memperbarui kalimat bila ada tambahan `extras`.
 */
export function triggerCallRecall(extras: string[] = []) {
  const s = callStore.get();
  if (!s.current) return;
  const call = s.current;
  const nextCount = call.callCount + 1;
  const extraSentence = extras.length ? " " + extras.join(" ") : "";
  const updated: ActiveCall = {
    ...call,
    callCount: nextCount,
    cooldownStartedAt: Date.now(),
    announcement: call.announcement + extraSentence,
  };
  callStore.set({ current: updated });
  // Perbarui jumlah_pemanggilan di Supabase pada row yang sama (bukan insert baru).
  void updateCallCallCount(updated);
}
