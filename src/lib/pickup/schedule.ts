/**
 * Helper jadwal kepulangan per-hari dari database.
 *
 * Kolom tabel `kelas` yang tersedia di database saat ini:
 *   senin_pulang, selasa_pulang, rabu_pulang,
 *   kamis_pulang, jumat_pulang
 *
 * `new Date().getDay()` mengembalikan 0=minggu .. 6=sabtu.
 * Hari sekolah (pulang) = Senin(1) .. Jumat(5).
 * Sabtu(6) & Minggu(0) = LIBUR → tidak ada jam kepulangan.
 */

/** Kolom yang benar-benar ada di tabel `kelas`. */
const EXISTING_COLUMNS = [
  "senin_pulang",
  "selasa_pulang",
  "rabu_pulang",
  "kamis_pulang",
  "jumat_pulang",
] as const;

/**
 * True jika hari ini adalah hari libur (Sabtu atau Minggu).
 * Sabtu(6) & Minggu(0) dianggap libur.
 */
export function isHoliday(now = new Date()): boolean {
  const d = now.getDay();
  return d === 0 || d === 6;
}

/**
 * Ambil kolom pulang untuk indeks hari (1=senin .. 5=jumat).
 * Hari lain (0,6) → null (libur).
 */
function dayColumn(dayIndex: number): string | null {
  if (dayIndex >= 1 && dayIndex <= 5) return EXISTING_COLUMNS[dayIndex - 1];
  return null;
}

/**
 * Ambil nilai jam pulang dari sebaris data kelas (Record) sesuai hari ini.
 * Mengembalikan string waktu berformat "HH.mm" (tanpa detik) atau null
 * bila hari libur / kolom hari kosong.
 */
export function getDayPulang(
  row: Record<string, unknown> | null | undefined,
  now = new Date()
): string | null {
  if (!row) return null;
  if (isHoliday(now)) return null;
  const col = dayColumn(now.getDay());
  if (!col) return null;
  const v = row[col];
  if (typeof v !== "string" || !v.trim()) return null;
  return formatHHmm(v);
}

/**
 * Normalisasi string waktu menjadi "HH.mm" — detik (":ss") dihilangkan.
 * Menangani berbagai format dari database: "14", "14:00", "14:00:00",
 * "14.00", "14.00.00", "14:00+07", dst.
 */
function formatHHmm(value: string): string {
  const t = value.trim();

  // Ambil bagian jam:menit bila ada, atau hanya jam.
  const m = t.replace(/\./g, ":").match(/(\d{1,2})[:\s-]?(\d{2})?/);
  if (!m) return t;

  const hh = String(Number(m[1])).padStart(2, "0");
  const mm = m[2] ? String(Number(m[2])).padStart(2, "0") : "00";
  return `${hh}.${mm}`;
}
