import { supabase } from "@/lib/supabase";
import { getStudents } from "@/lib/students";
import { sessionStore, type PickupRequest } from "@/lib/state/stores";

/**
 * CCTV PEMANTAU RIWAYAT PEMANGGILAN (backend/debug)
 * -----------------------------------------
 * Menyimpan log langkah INSERT/UPDATE ke Supabase di memori agar bisa
 * ditampilkan di panel CCTV (browser). Tidak menyentuh flow utama.
 */
export type CctvLogEntry = {
  id: string;
  ts: string;
  type: "info" | "ok" | "warn" | "error";
  table: string;
  action: "INSERT" | "UPDATE" | "SELECT" | "RESOLVE" | "SKIP";
message: string;
  idPemanggilan?: string | number;
  callCount?: number;
  detail?: string;
};

const cctvListeners = new Set<() => void>();
let cctvLogs: CctvLogEntry[] = [];

export function getCctvLogs(): CctvLogEntry[] {
  return cctvLogs;
}

export function subscribeCctv(fn: () => void) {
  cctvListeners.add(fn);
  return () => cctvListeners.delete(fn);
}

function pushCctv(entry: Omit<CctvLogEntry, "id" | "ts">) {
  const full: CctvLogEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ts: new Date().toLocaleTimeString("id-ID", { hour12: false }),
  };
  cctvLogs = [full, ...cctvLogs].slice(0, 200);
  cctvListeners.forEach((l) => l());
  // Selalu tampilkan di console juga agar mudah dicek.
  const tag = `[CCTV ${entry.action} ${entry.table}]`;
  if (entry.type === "error") console.error(tag, entry.message, entry.detail ?? "");
  else if (entry.type === "warn") console.warn(tag, entry.message, entry.detail ?? "");
  else console.log(tag, entry.message, entry.detail ?? "");
}

export function clearCctvLogs() {
  cctvLogs = [];
  cctvListeners.forEach((l) => l());
}

/**
 * MODUL RIWAYAT PEMANGGILAN (Supabase)
 * -----------------------------------------
 * Menyimpan riwayat pemanggilan ke tabel yang sudah ada:
 *   - `public.panggil_self`   (method = "self")
 *   - `public.panggil_other`  (method = "other")
 *   - `public.panggil_ojek`   (method = "ojek")
 *
 * Semua INSERT/UPDATE bersifat "fire & forget": error hanya di-log ke
 * console dan TIDAK pernah menghentikan/mengganggu alur pemanggilan utama.
 */

export type PickupTableName = "panggil_self" | "panggil_other" | "panggil_ojek";

function tableForMethod(method: PickupRequest["method"]): PickupTableName {
  if (method === "other") return "panggil_other";
  if (method === "ojek") return "panggil_ojek";
  return "panggil_self";
}

/** Resolve `users.id` (UUID) dari username yang sedang login. */
export async function resolveWaliId(username: string | null): Promise<string | null> {
  if (!username) {
    pushCctv({ type: "warn", table: "users", action: "SKIP", message: "Username kosong, id_wali = null" });
    return null;
  }
  const { data, error } = await supabase.from("users").select("id").eq("username", username).maybeSingle();
  if (error || !data) {
    pushCctv({
      type: "error",
      table: "users",
      action: "RESOLVE",
      message: "Gagal resolve id_wali dari username",
      detail: error?.message ?? "data wali kosong",
    });
    return null;
  }
  pushCctv({
    type: "ok",
    table: "users",
    action: "RESOLVE",
    message: `id_wali ditemukan: ${String(data.id)}`,
  });
  return String(data.id);
}

/**
 * id_pemanggilan untuk tabel panggil_* adalah BIGINT, jadi harus angka.
 * Gunakan timestamp (ms) sebagai id numerik unik.
 */
function numericId(): number {
  return Date.now();
}

/**
 * Format timestamp ke waktu WIB (UTC+7) dengan offset +07:00.
 * Karena Supabase menyimpan `timestamp with time zone` ((dikonversi ke UTC),
 * kita kirim nilai yang sudah eksplisit +07:00 agar tampil benar di dashboard.
 */
function toWib(ts?: number): string {
  const d = ts ? new Date(ts) : new Date();
  // Konversi ke WIB lalu seri lainkan dengan offset +07:00
  const wib = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  return wib.toISOString().replace("Z", "+07:00");
}

/** Bangun payload INSERT/UPDATE untuk tabel berdasarkan method. */
function buildPayload(req: PickupRequest, idWali: string | null) {
  const students = getStudents();
  // Ambil SEMUA siswa yang dipanggil dalam satu request.
  const called = req.studentIds
    .map((id) => students.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  // Nama semua siswa ditumpuk dalam SATU kolom, dipisah koma.
  const allNames = called
    .map((s) => s.name?.trim())
    .filter(Boolean)
    .join(", ");

  const first = called[0];
  const firstName = allNames || req.studentIds[0] || "";
  const firstClass = first?.className ?? "";
  const firstIdKelas = first?.idKelas ?? "";

  const base = {
    id_pemanggilan: req.idPemanggilan ? Number(req.idPemanggilan) : numericId(),
    uid_siswa: first?.id ?? req.studentIds[0] ?? null,
    nama_siswa: firstName || null,
    kelas: firstClass || null,
    id_kelas: firstIdKelas || null,
    id_wali: idWali,
    waktu_pemanggilan: toWib(req.createdAt),
    posisi_tunggu: req.waitLocation?.trim() || null,
    catatan_p: req.note?.trim() || null,
    short_messg: req.announcement || null,
    method: req.method,
    jumlah_pemanggilan: req.callCount,
    kata_panggilan: req.announcement || null,
    done: false,
  };

  if (req.method === "other") {
    return { ...base, nama_penjemput: req.pickerName?.trim() || null };
  }

  if (req.method === "ojek") {
    return { ...base, plat_ojek: req.plate?.trim() || null, platform: req.platform?.trim() || null };
  }

  return base;
}

/**
 * INSERT riwayat saat pemanggilan pertama kali dibuat.
 * Setelah berhasil, `id_pemanggilan` dari record disimpan kembali ke objek
 * pemanggilan aktif (pickupStore) agar recall/mark-done bisa UPDATE row yang sama.
 */
export async function insertPickupHistory(req: PickupRequest): Promise<void> {
  try {
    const idWali = await resolveWaliId(sessionStore.get().username);
    const table = tableForMethod(req.method);
    const payload = buildPayload(req, idWali);

    pushCctv({
      type: "info",
      table,
      action: "INSERT",
      message: `Mengirim INSERT ke ${table}`,
      idPemanggilan: payload.id_pemanggilan,
      callCount: req.callCount,
      detail: JSON.stringify({ nama_siswa: payload.nama_siswa, id_wali: idWali }),
    });

    const { data, error } = await supabase.from(table).insert(payload).select().maybeSingle();

    if (error) {
      pushCctv({
        type: "error",
        table,
        action: "INSERT",
        message: `INSERT ${table} GAGAL`,
        idPemanggilan: payload.id_pemanggilan,
        callCount: req.callCount,
        detail: error.message,
      });
      return;
    }

    pushCctv({
      type: "ok",
      table,
      action: "INSERT",
      message: `INSERT ${table} BERHASIL`,
      idPemanggilan: data?.id_pemanggilan ? String(data.id_pemanggilan) : payload.id_pemanggilan,
      callCount: req.callCount,
      detail: data ? `row id_pemanggilan: ${String(data.id_pemanggilan)}` : "data kosong",
    });

    if (data && data.id_pemanggilan) {
      // Simpan id_pemanggilan ke state aktif untuk UPDATE berikutnya.
      persistIdPemanggilan(req, String(data.id_pemanggilan));
    }
  } catch (e) {
    pushCctv({
      type: "error",
      table: tableForMethod(req.method),
      action: "INSERT",
      message: "INSERT error (exception)",
      detail: e instanceof Error ? e.message : String(e),
    });
  }
}

/**
 * UPDATE `jumlah_pemanggilan` pada row yang sama (id_pemanggilan) saat
 * recall / panggil ulang. TIDAK membuat row baru.
 */
export async function updatePickupCallCount(req: PickupRequest): Promise<void> {
  // id_pemanggilan untuk tabel panggil_* adalah BIGINT (angka).
  // Gunakan angka yang sudah dipersist dari INSERT; fallback ke timestamp.
  const idPemanggilan = req.idPemanggilan ? Number(req.idPemanggilan) : numericId();
  const table = tableForMethod(req.method);
  try {
    pushCctv({
      type: "info",
      table,
      action: "UPDATE",
      message: `UPDATE jumlah_pemanggilan=${req.callCount} di ${table}`,
      idPemanggilan,
      callCount: req.callCount,
    });
    const { error } = await supabase
      .from(table)
      .update({ jumlah_pemanggilan: req.callCount })
      .eq("id_pemanggilan", idPemanggilan);
    if (error) {
      pushCctv({
        type: "error",
        table,
        action: "UPDATE",
        message: `UPDATE jumlah_pemanggilan ${table} GAGAL`,
        idPemanggilan,
        callCount: req.callCount,
        detail: error.message,
      });
    } else {
      pushCctv({
        type: "ok",
        table,
        action: "UPDATE",
        message: `UPDATE jumlah_pemanggilan=${req.callCount} BERHASIL`,
        idPemanggilan,
        callCount: req.callCount,
      });
    }
  } catch (e) {
    pushCctv({
      type: "error",
      table,
      action: "UPDATE",
      message: "UPDATE jumlah_pemanggilan error (exception)",
      idPemanggilan,
      callCount: req.callCount,
      detail: e instanceof Error ? e.message : String(e),
    });
  }
}

/**
 * UPDATE `done = true` pada row yang sama saat penjemputan selesai
 * (atau dihentikan paksa). TIDAK membuat row baru.
 */
export async function markPickupDone(req: PickupRequest): Promise<void> {
  const idPemanggilan = req.idPemanggilan ? Number(req.idPemanggilan) : numericId();
  const table = tableForMethod(req.method);
  try {
    pushCctv({
      type: "info",
      table,
      action: "UPDATE",
      message: `UPDATE done=true di ${table}`,
      idPemanggilan,
      callCount: req.callCount,
    });
    const { error } = await supabase
      .from(table)
      .update({ done: true })
      .eq("id_pemanggilan", idPemanggilan);
    if (error) {
      pushCctv({
        type: "error",
        table,
        action: "UPDATE",
        message: `UPDATE done ${table} GAGAL`,
        idPemanggilan,
        callCount: req.callCount,
        detail: error.message,
      });
    } else {
      pushCctv({
        type: "ok",
        table,
        action: "UPDATE",
        message: `UPDATE done=true BERHASIL`,
        idPemanggilan,
        callCount: req.callCount,
      });
    }
  } catch (e) {
    pushCctv({
      type: "error",
      table,
      action: "UPDATE",
      message: "UPDATE done error (exception)",
      idPemanggilan,
      callCount: req.callCount,
      detail: e instanceof Error ? e.message : String(e),
    });
  }
}

/** Tipe item riwayat ter-normalisasi untuk ditampilkan di halaman Riwayat. */
export type PickupHistoryItem = {
  id: string;
  student: string; // nama_siswa (sudah dipisah koma)
  method: string;
  date: string;
  time: string;
  status: string;
};

const METHOD_LABEL: Record<string, string> = {
  self: "Jemput Sendiri",
  other: "Diwakilkan",
  ojek: "Ojek Online",
};

/**
 * Ambil seluruh riwayat pemanggilan milik user yang sedang login
 * (berdasarkan id_wali = users.id) dari ketiga tabel panggil_*.
 * Urutkan dari yang terbaru. Return array kosong bila gagal/tidak ada.
 */
export async function fetchPickupHistory(): Promise<PickupHistoryItem[]> {
  const idWali = await resolveWaliId(sessionStore.get().username);
  if (!idWali) return [];

  const tables: PickupTableName[] = ["panggil_self", "panggil_other", "panggil_ojek"];
  const results: PickupHistoryItem[] = [];

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select("id_pemanggilan, nama_siswa, method, waktu_pemanggilan, jumlah_pemanggilan, done")
      .eq("id_wali", idWali)
      .order("id_pemanggilan", { ascending: false });

    if (error) {
      pushCctv({ type: "error", table, action: "SELECT", message: `SELECT ${table} GAGAL`, detail: error.message });
      continue;
    }

    for (const row of data ?? []) {
      const raw = row as {
        id_pemanggilan: number | string;
        nama_siswa?: string | null;
        method?: string;
        waktu_pemanggilan?: string | null;
        jumlah_pemanggilan?: number;
        done?: boolean;
      };
      const label = METHOD_LABEL[raw.method ?? ""] ?? raw.method ?? "Penjemputan";
      // Format tanggal & jam dari timestamp.
      const d = raw.waktu_pemanggilan ? new Date(raw.waktu_pemanggilan) : null;
      const date = d
        ? d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
        : "-";
      const time = d
        ? d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
        : "-";
      results.push({
        id: String(raw.id_pemanggilan),
        student: raw.nama_siswa?.trim() || "-",
        method: label,
        date,
        time,
        status: raw.done ? "Selesai" : "Diproses",
      });
    }
  }

  // Gabung & urutkan berdasarkan id_pemanggilan (timestamp) terbaru.
  results.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
  return results;
}

/** Utilitas internal: menulis id_pemanggilan ke pickupStore.current. */
function persistIdPemanggilan(req: PickupRequest, idPemanggilan: string) {
  // Lazy import untuk menghindari circular dependency (stores <-> simulator).
  import("@/lib/state/stores").then(({ pickupStore }) => {
    const st = pickupStore.get();
    if (!st.current || st.current.id !== req.id) return;
    pickupStore.set({
      current: { ...st.current, idPemanggilan },
    });
  });
}
