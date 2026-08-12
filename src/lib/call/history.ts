import { supabase } from "@/lib/supabase";
import { getStudents } from "@/lib/students";
import { sessionStore } from "@/lib/state/stores";
import { ensureUnusedPemanggilanId, resolveWaliId, toWib, pushCctv, type CctvLogEntry } from "@/lib/pickup/history";
import type { ActiveCall, CallType } from "@/lib/call/stores";

/**
 * MODUL RIWAYAT PANGGILAN (Supabase)
 * -----------------------------------------
 * Menyimpan riwayat panggilan "ditunggu" & "titipan" ke tabel yang sudah ada:
 *   - `public.panggil_ditunggu`  (type = "ditunggu") → id_jenis_pemanggilan = 4
 *   - `public.panggil_titipan`   (type = "titipan")  → id_jenis_pemanggilan = 5
 *
 * Semua INSERT/UPDATE bersifat "fire & forget": error hanya di-log ke console
 * dan TIDAK pernah menghentikan/mengganggu alur pemanggilan utama.
 */

export type CallTableName = "panggil_ditunggu" | "panggil_titipan";

function tableForType(type: CallType): CallTableName {
  return type === "titipan" ? "panggil_titipan" : "panggil_ditunggu";
}

/** id_jenis_pemanggilan dari tabel `type_panggil`: ditunggu=4, titipan=5. */
function callTypeId(type: CallType): number {
  return type === "titipan" ? 5 : 4;
}

/**
 * id_pemanggilan untuk tabel panggil_* adalah BIGINT, jadi harus angka.
 * Gunakan timestamp (ms) sebagai id numerik unik.
 */
function numericId(): number {
  return Date.now();
}

/** Bangun payload INSERT untuk tabel berdasarkan type. */
function buildPayload(call: ActiveCall, idWali: string | null) {
  const students = getStudents();
  const called = call.studentIds
    .map((id) => students.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const allNames = called
    .map((s) => s.name?.trim())
    .filter(Boolean)
    .join(", ");

  const first = called[0];
  const namaSiswa = allNames || call.studentIds[0] || "";
  const kelas = first?.className ?? "";
  const idKelas = first?.idKelas ?? "";
  const method = call.payload.method || (call.type === "titipan" ? "titipan" : "ditunggu");

  // short_messg = catatan singkat dari user (pesan tambahan).
  // kata_panggilan = teks keseluruhan yang akan dipanggilkan.
  const shortMessg = call.payload.shortMessg?.trim() || null;
  const kataPanggilan = call.announcement || kataPanggilanFrom(call) || null;

  const base = {
    id_pemanggilan: call.idPemanggilan ? Number(call.idPemanggilan) : numericId(),
    uid_siswa: first?.id ?? call.studentIds[0] ?? null,
    nama_siswa: namaSiswa || null,
    kelas: kelas || null,
    id_kelas: idKelas || null,
    id_wali: idWali,
    waktu_pemanggilan: toWib(call.createdAt),
    short_messg: shortMessg,
    method: method,
    jumlah_pemanggilan: call.callCount,
    kata_panggilan: kataPanggilan,
    done: false,
    id_jenis_pemanggilan: callTypeId(call.type),
  };

  if (call.type === "titipan" && call.payload.type === "titipan") {
    return {
      ...base,
      nama_penitip: call.payload.namaPenitip?.trim() || null,
      jenis_titipan: call.payload.jenisTitipan?.trim() || null,
    };
  }

  if (call.payload.type === "ditunggu") {
    return {
      ...base,
      ditunggu_oleh: call.payload.ditungguOleh?.trim() || null,
      posisi_tunggu: call.payload.posisiTunggu?.trim() || null,
    };
  }

  return base;
}

/**
 * Bangun kata_panggilan lengkap dari data call (where/who/what + catatan).
 * Dipakai sebagai fallback bila `call.announcement` belum diisi.
 */
export function kataPanggilanFrom(call: ActiveCall): string {
  const students = getStudents();
  const names = call.studentIds
    .map((id) => students.find((s) => s.id === id)?.name)
    .filter(Boolean)
    .join(" dan Ananda ");
  const cls = students.find((s) => s.id === call.studentIds[0])?.className ?? "";
  const tail = call.payload.shortMessg?.trim();
  if (call.type === "titipan" && call.payload.type === "titipan") {
    return `Kepada Ananda ${names} kelas ${cls}, dipersilakan menuju area penjemputan untuk mengambil titipan dari ${
      call.payload.namaPenitip || "wali"
    } (${call.payload.jenisTitipan || "titipan"}).${tail ? ` ${tail}` : ""} Terima kasih.`;
  }
  if (call.payload.type === "ditunggu") {
    return `Kepada Ananda ${names} kelas ${cls}, dipersilakan menuju ${call.payload.posisiTunggu || "area penjemputan"} karena ${
      call.payload.ditungguOleh || "seseorang"
    } sedang menunggu.${tail ? ` ${tail}` : ""} Terima kasih.`;
  }
  return names ? `Kepada Ananda ${names} kelas ${cls}, dipersilakan menuju area penjemputan. Terima kasih.` : "";
}

/**
 * INSERT riwayat saat panggilan pertama kali dibuat.
 * Setelah berhasil, `id_pemanggilan` dari record disimpan kembali ke objek
 * panggilan aktif (callStore) agar recall/mark-done bisa UPDATE row yang sama.
 */
export async function insertCallHistory(call: ActiveCall): Promise<void> {
  try {
    const idPemanggilan = await ensureUnusedPemanggilanId(Number(call.idPemanggilan));
    const safeCall = { ...call, idPemanggilan };
    const idWali = await resolveWaliId(sessionStore.get().username);
    const table = tableForType(safeCall.type);
    const payload = buildPayload(safeCall, idWali);

    pushCctv({
      type: "info",
      table,
      action: "INSERT",
      message: `Mengirim INSERT ke ${table}`,
      idPemanggilan: payload.id_pemanggilan,
      callCount: safeCall.callCount,
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
        callCount: safeCall.callCount,
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
      callCount: safeCall.callCount,
      detail: data ? `row id_pemanggilan: ${String(data.id_pemanggilan)}` : "data kosong",
    });

    if (data && data.id_pemanggilan) {
      persistIdPemanggilan(call, String(data.id_pemanggilan));
    }
  } catch (e) {
    pushCctv({
      type: "error",
      table: tableForType(call.type),
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
export async function updateCallCallCount(call: ActiveCall): Promise<void> {
  const idPemanggilan = call.idPemanggilan ? Number(call.idPemanggilan) : numericId();
  const table = tableForType(call.type);
  try {
    pushCctv({
      type: "info",
      table,
      action: "UPDATE",
      message: `UPDATE jumlah_pemanggilan=${call.callCount} di ${table}`,
      idPemanggilan,
      callCount: call.callCount,
    });
    const { error } = await supabase
      .from(table)
      .update({ jumlah_pemanggilan: call.callCount })
      .eq("id_pemanggilan", idPemanggilan);
    if (error) {
      pushCctv({
        type: "error",
        table,
        action: "UPDATE",
        message: `UPDATE jumlah_pemanggilan ${table} GAGAL`,
        idPemanggilan,
        callCount: call.callCount,
        detail: error.message,
      });
    } else {
      pushCctv({
        type: "ok",
        table,
        action: "UPDATE",
        message: `UPDATE jumlah_pemanggilan=${call.callCount} BERHASIL`,
        idPemanggilan,
        callCount: call.callCount,
      });
    }
  } catch (e) {
    pushCctv({
      type: "error",
      table,
      action: "UPDATE",
      message: "UPDATE jumlah_pemanggilan error (exception)",
      idPemanggilan,
      callCount: call.callCount,
      detail: e instanceof Error ? e.message : String(e),
    });
  }
}

/**
 * UPDATE `done = true` pada row yang sama saat panggilan ditandai selesai
 * (titipan diambil / ditunggu selesai). TIDAK membuat row baru.
 */
export async function markCallDone(call: ActiveCall): Promise<void> {
  const idPemanggilan = call.idPemanggilan ? Number(call.idPemanggilan) : numericId();
  const table = tableForType(call.type);
  try {
    pushCctv({
      type: "info",
      table,
      action: "UPDATE",
      message: `UPDATE done=true di ${table}`,
      idPemanggilan,
      callCount: call.callCount,
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
        callCount: call.callCount,
        detail: error.message,
      });
    } else {
      pushCctv({
        type: "ok",
        table,
        action: "UPDATE",
        message: `UPDATE done=true BERHASIL`,
        idPemanggilan,
        callCount: call.callCount,
      });
    }
  } catch (e) {
    pushCctv({
      type: "error",
      table,
      action: "UPDATE",
      message: "UPDATE done error (exception)",
      idPemanggilan,
      callCount: call.callCount,
      detail: e instanceof Error ? e.message : String(e),
    });
  }
}

/** Utilitas internal: menulis id_pemanggilan ke callStore.current. */
function persistIdPemanggilan(call: ActiveCall, idPemanggilan: string) {
  // Lazy import untuk menghindari circular dependency (stores <-> history).
  import("@/lib/call/stores").then(({ callStore }) => {
    const st = callStore.get();
    if (!st.current || st.current.id !== call.id) return;
    callStore.set({
      current: { ...st.current, idPemanggilan },
    });
  });
}

/** Tipe item riwayat ter-normalisasi untuk ditampilkan di halaman Riwayat (tab Panggil). */
export type CallHistoryItem = {
  id: string;
  student: string; // nama_siswa (sudah dipisah koma)
  method: string; // label jenis panggilan
  date: string;
  time: string;
  status: string;
  /** Total panggilan awal + seluruh recall untuk id_pemanggilan yang sama. */
  callCount: number;
  ts: number; // timestamp mentah (ms) untuk filter yang akurat
};

const CALL_METHOD_LABEL: Record<string, string> = {
  ditunggu: "Panggil Ditunggu",
  titipan: "Ambil Titipan",
};

/**
 * Ambil seluruh riwayat panggilan (ditunggu & titipan) milik user yang login
 * (berdasarkan id_wali = users.id) dari tabel `panggil_ditunggu` & `panggil_titipan`.
 * Urutkan dari yang terbaru. Return array kosong bila gagal/tidak ada.
 */
export async function fetchCallHistory(): Promise<CallHistoryItem[]> {
  const idWali = await resolveWaliId(sessionStore.get().username);
  if (!idWali) return [];

  const tables: CallTableName[] = ["panggil_ditunggu", "panggil_titipan"];
  const grouped = new Map<string, CallHistoryItem>();

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
      const label =
        CALL_METHOD_LABEL[raw.method ?? ""] ??
        (table === "panggil_titipan" ? "Ambil Titipan" : "Panggil Ditunggu");
      const d = raw.waktu_pemanggilan ? new Date(raw.waktu_pemanggilan) : null;
      const date = d
        ? d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
        : "-";
      const time = d ? d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-";
      const item: CallHistoryItem = {
        id: String(raw.id_pemanggilan),
        student: raw.nama_siswa?.trim() || "-",
        method: label,
        date,
        time,
        status: raw.done ? "Selesai" : "Diproses",
        ts: d ? d.getTime() : Number(raw.id_pemanggilan) || Date.now(),
        callCount: Number(raw.jumlah_pemanggilan) || 1,
      };
      const key = `${table}:${item.id}`;
      const previous = grouped.get(key);
      if (!previous) {
        grouped.set(key, item);
      } else if (item.ts < previous.ts) {
        grouped.set(key, { ...item, callCount: Math.max(previous.callCount, item.callCount), status: previous.status === "Selesai" || item.status === "Selesai" ? "Selesai" : "Diproses" });
      } else {
        grouped.set(key, { ...previous, callCount: Math.max(previous.callCount, item.callCount), status: previous.status === "Selesai" || item.status === "Selesai" ? "Selesai" : "Diproses" });
      }
    }
  }

  const results = [...grouped.values()];
  results.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
  return results;
}

export type { CctvLogEntry };
