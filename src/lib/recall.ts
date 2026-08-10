import { supabase } from "@/lib/supabase";
import { toWib } from "@/lib/pickup/history";

export type RecallSourceTable =
  | "panggil_self"
  | "panggil_other"
  | "panggil_ojek"
  | "panggil_ditunggu"
  | "panggil_titipan";

type SourceCallRow = {
  id_pemanggilan: number | string;
  jumlah_pemanggilan: number | null;
  kata_panggilan: string | null;
  short_messg: string | null;
};

const inFlightRecallIds = new Set<string>();

/**
 * Menyimpan satu recall untuk semua jenis pemanggilan.
 * Teks selalu dibaca dari row pemanggilan asal agar suara recall konsisten
 * dengan kata_panggilan yang pertama kali tersimpan.
 */
export async function persistRecall(sourceTable: RecallSourceTable, idPemanggilan: string | number) {
  const id = Number(idPemanggilan);
  if (!Number.isFinite(id)) {
    throw new Error("ID pemanggilan belum tersedia untuk recall.");
  }

  const lockKey = `${sourceTable}:${id}`;
  if (inFlightRecallIds.has(lockKey)) {
    throw new Error("Recall sedang diproses.");
  }

  inFlightRecallIds.add(lockKey);
  try {
    const { data: source, error: sourceError } = await supabase
      .from(sourceTable)
      .select("id_pemanggilan, jumlah_pemanggilan, kata_panggilan, short_messg")
      .eq("id_pemanggilan", id)
      .maybeSingle();

    if (sourceError || !source) {
      throw new Error(sourceError?.message ?? "Data pemanggilan asal tidak ditemukan.");
    }

    const row = source as SourceCallRow;
    const text = row.kata_panggilan?.trim() || row.short_messg?.trim();
    if (!text) {
      throw new Error("Teks pemanggilan asli tidak tersedia.");
    }

    const { data: latestRecall, error: recallReadError } = await supabase
      .from("recall")
      .select("pemanggilan_ke")
      .eq("id_pemanggilan", id)
      .order("pemanggilan_ke", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recallReadError) throw new Error(recallReadError.message);

    const sourceCount = Number(row.jumlah_pemanggilan) || 1;
    const recalledCount = Number(latestRecall?.pemanggilan_ke) || 1;
    const pemanggilanKe = Math.max(sourceCount, recalledCount) + 1;
    const { error: insertError } = await supabase.from("recall").insert({
      id_pemanggilan: id,
      pemanggilan_ke: pemanggilanKe,
      text_pemanggilan: text,
      waktu_pemanggilan: toWib(),
    });

    if (insertError) throw new Error(insertError.message);
    return { pemanggilanKe, text };
  } finally {
    inFlightRecallIds.delete(lockKey);
  }
}
