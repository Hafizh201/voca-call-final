import { supabase } from "@/lib/supabase";

/**
 * MODUL PENGUMUMAN SEKOLAH (Supabase)
 * -----------------------------------------
 * Mengambil dan menampilkan pengumuman sekolah dari tabel `announcement`.
 *
 * Skema tabel `announcement`:
 *   id              : int8 (primary key)
 *   judul           : text (judul pengumuman)
 *   isi             : text (isi/deskripsi pengumuman)
 *   tanggal_mulai   : timestamptz (mulai tayang)
 *   tanggal_selesai : timestamptz (selesai tayang)
 *   aktif           : bool (aktif / nonaktif)
 *   created_at      : timestamptz
 *   updated_at      : timestamptz
 */

export type Announcement = {
  id: number;
  judul: string;
  isi?: string | null;
  tanggalMulai?: string | null;
  tanggalSelesai?: string | null;
  aktif: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
};

/**
 * Ambil daftar pengumuman yang AKTIF dan masih dalam masa tayang
 * (tanggal_mulai <= sekarang <= tanggal_selesai), urut dari yang terbaru.
 * Jika tanggal null, dianggap selalu tayang selama `aktif = true`.
 */
export async function fetchAnnouncements(): Promise<Announcement[]> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("announcement")
    .select("id, judul, isi, tanggal_mulai, tanggal_selesai, aktif, created_at, updated_at")
    .eq("aktif", true)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const rows = data as unknown as Array<Record<string, unknown>>;

  return rows
    .filter((a) => {
      // Filter berdasarkan masa tayang bila tanggal diisi.
      const mulai = a.tanggal_mulai ? new Date(a.tanggal_mulai as string).getTime() : null;
      const selesai = a.tanggal_selesai ? new Date(a.tanggal_selesai as string).getTime() : null;
      const current = Date.now();
      if (mulai && current < mulai) return false;
      if (selesai && current > selesai) return false;
      return true;
    })
    .map((a) => ({
      id: Number(a.id),
      judul: (a.judul as string)?.trim() || "Pengumuman",
      isi: (a.isi as string | null) ?? null,
      tanggalMulai: (a.tanggal_mulai as string | null) ?? null,
      tanggalSelesai: (a.tanggal_selesai as string | null) ?? null,
      aktif: Boolean(a.aktif),
      createdAt: (a.created_at as string | null) ?? null,
      updatedAt: (a.updated_at as string | null) ?? null,
    }));
}

/** Format timestamp ke "07.10" / "Kemarin" / tanggal lokal. */
export function formatAnnouncementTime(ts?: string | null): string {
  if (!ts) return "";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return "";

  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

  if (dStart === startToday) {
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(":", ".");
  }
  const yesterday = startToday - 24 * 60 * 60 * 1000;
  if (dStart === yesterday) return "Kemarin";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}
