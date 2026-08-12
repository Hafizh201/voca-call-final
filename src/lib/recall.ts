import { supabase } from "@/lib/supabase";
import { toWib } from "@/lib/pickup/history";

export type RecallSourceTable =
  | "panggil_self"
  | "panggil_other"
  | "panggil_ojek"
  | "panggil_ditunggu"
  | "panggil_titipan";

type SourceCallRow = Record<string, unknown> & {
  id_pemanggilan: number | string;
  jumlah_pemanggilan: number | null;
};

const inFlightRecallIds = new Set<string>();

/** Daftar ID untuk pemulihan data lama yang belum menyimpan id di browser. */
export async function listRecallIds(sourceTable: RecallSourceTable): Promise<string[]> {
  const { data, error } = await supabase.from(sourceTable).select("id_pemanggilan").order("waktu_pemanggilan", { ascending: false }).limit(100);
  if (error) throw new Error(error.message);
  return [...new Set((data ?? []).map((row) => String((row as { id_pemanggilan: string | number }).id_pemanggilan)))];
}

/**
 * Recall bersifat append-only. Satu klik menghasilkan dua INSERT:
 * 1. salinan baru di panggil_<method>, dengan id_pemanggilan yang SAMA;
 * 2. riwayat baru di recall.
 * Tidak ada UPDATE pada kedua tabel ini.
 */
export async function persistRecall(
  sourceTable: RecallSourceTable,
  idPemanggilan: string | number,
  kataPanggilan: string,
) {
  const id = Number(idPemanggilan);
  if (!Number.isFinite(id)) throw new Error("ID pemanggilan belum dipilih.");
  if (!kataPanggilan.trim()) throw new Error("Kata pemanggilan kosong.");

  const lockKey = `${sourceTable}:${id}`;
  if (inFlightRecallIds.has(lockKey)) throw new Error("Recall sedang diproses.");
  inFlightRecallIds.add(lockKey);
  try {
    // Bisa ada beberapa row dengan id_pemanggilan sama setelah recall.
    // Ambil row terbaru sebagai cetakan, bukan maybeSingle().
    const { data: source, error: sourceError } = await supabase
      .from(sourceTable)
      .select("*")
      .eq("id_pemanggilan", id)
      .order("waktu_pemanggilan", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (sourceError || !source) throw new Error(sourceError?.message ?? "Data pemanggilan asal tidak ditemukan.");

    const row = source as SourceCallRow;
    const { id: _rowId, created_at: _createdAt, updated_at: _updatedAt, ...copy } = row;
    const { data: latestRecall, error: recallReadError } = await supabase
      .from("recall")
      .select("pemanggilan_ke")
      .eq("id_pemanggilan", id)
      .order("pemanggilan_ke", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (recallReadError) throw new Error(recallReadError.message);

    const pemanggilanKe = Math.max(Number(row.jumlah_pemanggilan) || 1, Number(latestRecall?.pemanggilan_ke) || 1) + 1;
    // Hanya dua nilai berikut yang berubah dari salinan row panggil sebelumnya.
    const { error: callInsertError } = await supabase.from(sourceTable).insert({
      ...copy,
      id_pemanggilan: id,
      jumlah_pemanggilan: pemanggilanKe,
      kata_panggilan: kataPanggilan,
    });
    if (callInsertError) throw new Error(callInsertError.message);

    const { error: recallInsertError } = await supabase.from("recall").insert({
      id_pemanggilan: id,
      pemanggilan_ke: pemanggilanKe,
      text_pemanggilan: kataPanggilan,
      waktu_pemanggilan: toWib(),
    });
    if (recallInsertError) throw new Error(recallInsertError.message);
    return { pemanggilanKe, text: kataPanggilan };
  } finally {
    inFlightRecallIds.delete(lockKey);
  }
}
