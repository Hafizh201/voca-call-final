import { supabase } from "@/lib/supabase";
import { getStudents } from "@/lib/students";
import { sessionStore, type PickupRequest } from "@/lib/state/stores";

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
  if (!username) return null;
  const { data, error } = await supabase.from("users").select("id").eq("username", username).maybeSingle();
  if (error || !data) {
    console.error("[RIWAYAT PEMANGGILAN] Gagal resolve id_wali:", error?.message ?? "data wali kosong");
    return null;
  }
  return String(data.id);
}

/** Bangun payload INSERT/UPDATE untuk tabel berdasarkan method. */
function buildPayload(req: PickupRequest, idWali: string | null) {
  const students = getStudents();
  const first = students.find((s) => s.id === req.studentIds[0]);
  const firstName = first?.name ?? req.studentIds[0] ?? "";
  const firstClass = first?.className ?? "";
  const firstIdKelas = first?.idKelas ?? "";

  const base = {
    id_pemanggilan: req.idPemanggilan ?? req.id,
    uid_siswa: first?.id ?? req.studentIds[0] ?? null,
    nama_siswa: firstName || null,
    kelas: firstClass || null,
    id_kelas: firstIdKelas || null,
    id_wali: idWali,
    waktu_pemanggilan: req.createdAt ? new Date(req.createdAt).toISOString() : new Date().toISOString(),
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

    const { data, error } = await supabase.from(table).insert(payload).select().maybeSingle();

    if (error) {
      console.error(`[RIWAYAT PEMANGGILAN] INSERT ${table} gagal:`, error.message);
      return;
    }

    if (data && data.id_pemanggilan) {
      // Simpan id_pemanggilan ke state aktif untuk UPDATE berikutnya.
      persistIdPemanggilan(req, String(data.id_pemanggilan));
    }
  } catch (e) {
    console.error("[RIWAYAT PEMANGGILAN] INSERT error:", e);
  }
}

/**
 * UPDATE `jumlah_pemanggilan` pada row yang sama (id_pemanggilan) saat
 * recall / panggil ulang. TIDAK membuat row baru.
 */
export async function updatePickupCallCount(req: PickupRequest): Promise<void> {
  // id_pemanggilan bawaan INSERT adalah `req.id` bila belum ada id asli dari DB.
  const idPemanggilan = req.idPemanggilan ?? req.id;
  const table = tableForMethod(req.method);
  try {
    const { error } = await supabase
      .from(table)
      .update({ jumlah_pemanggilan: req.callCount })
      .eq("id_pemanggilan", idPemanggilan);
    if (error) {
      console.error(`[RIWAYAT PEMANGGILAN] UPDATE jumlah_pemanggilan ${table} gagal:`, error.message);
    }
  } catch (e) {
    console.error("[RIWAYAT PEMANGGILAN] UPDATE jumlah_pemanggilan error:", e);
  }
}

/**
 * UPDATE `done = true` pada row yang sama saat penjemputan selesai
 * (atau dihentikan paksa). TIDAK membuat row baru.
 */
export async function markPickupDone(req: PickupRequest): Promise<void> {
  const idPemanggilan = req.idPemanggilan ?? req.id;
  const table = tableForMethod(req.method);
  try {
    const { error } = await supabase
      .from(table)
      .update({ done: true })
      .eq("id_pemanggilan", idPemanggilan);
    if (error) {
      console.error(`[RIWAYAT PEMANGGILAN] UPDATE done ${table} gagal:`, error.message);
    }
  } catch (e) {
    console.error("[RIWAYAT PEMANGGILAN] UPDATE done error:", e);
  }
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
