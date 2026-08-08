export type Student = {
  id: string;
  name: string;
  nickname: string;
  className: string;
  nis: string;
  avatarColor: string;
  attendedAt?: string;
  dismissedAt?: string;
  attendanceStatus: "hadir" | "izin" | "belum";
  dismissStatus: "belum" | "sudah";
  pendingApproval?: boolean;
};

/**
 * Data siswa dihapus dari dummy.
 * Data siswa kini diambil langsung dari  database online (Supabase)
 * pada tabel `users` kolom `siswa1`, `siswa2`, `siswa3`.
 * Lihat `src/lib/students.ts` untuk sumber data baru.
 */
export const students: Student[] = [];

export const announcements = [
  {
    id: "a1",
    tag: "Pengumuman",
    title: "Jam pulang hari ini pukul 14.00",
    body: "Kegiatan ekstrakurikuler ditiadakan karena rapat guru.",
    time: "07.10",
  },
  {
    id: "a2",
    tag: "Info Sekolah",
    title: "Pekan literasi 25–29 November",
    body: "Siswa diminta membawa satu buku bacaan favorit setiap harinya.",
    time: "Kemarin",
  },
];

export const tips = [
  "Silakan menunggu di area penjemputan yang telah disediakan.",
  "Pastikan kendaraan tidak menghalangi jalur keluar.",
  "Siapkan identitas apabila petugas meminta konfirmasi.",
];

export const recentPickups = [
  { id: "r1", student: "Fauzan", method: "Dijemput Sendiri", date: "Kemarin", time: "14.12", status: "Selesai" },
  { id: "r2", student: "Nadhira", method: "Ojek Online", date: "2 hari lalu", time: "12.05", status: "Selesai" },
  { id: "r3", student: "Fauzan", method: "Dijemput Orang Lain", date: "Senin", time: "14.30", status: "Selesai" },
];

export const notifications = [
  { id: "n1", title: "Penjemputan Nadhira selesai", body: "Kalimat pemanggilan telah diputar.", time: "Kemarin 12.05", read: true },
  { id: "n2", title: "Pengumuman sekolah baru", body: "Jam pulang hari ini pukul 14.00.", time: "07.10", read: false },
];

export const contacts = [
  { id: "c1", role: "Tata Usaha", name: "Ibu Sari", phone: "0812-3400-0001" },
  { id: "c2", role: "Satpam", name: "Pak Rahmat", phone: "0812-3400-0002" },
  { id: "c3", role: "Admin Penjemputan", name: "Bu Rina", phone: "0812-3400-0003" },
];

export const secondCallOptions = [
  "Mohon segera menuju area penjemputan.",
  "Apabila masih mengikuti kegiatan, mohon mengabari wali kelas terlebih dahulu.",
  "Orang tua telah menunggu di gerbang utama.",
  "Silakan menemui penjemput di area parkir.",
  "Segera bergegas, penjemput dalam waktu terbatas.",
];

export const dismissalTime = "14.00";
export const schoolName = "SMPIT Abu Bakar Fullday School";

/**
 * Batas waktu maksimal pemanggilan penjemputan (waktu WIB / UTC+7).
 * Berlaku HANYA pada hari sekolah (Senin–Jumat).
 * Jika pemanggilan belum selesai sampai jam ini, sistem otomatis menghentikannya.
 * Format: "HH.mm" (24 jam). Ubah di sini untuk menyesuaikan batas waktu.
 */
export const MAX_PICKUP_TIME_WIB = "22.00";

/**
 * SAKELAR UTAMA pemanggilan penjemputan (master on/off).
 * - `true`  → pemanggilan aktif (mengikuti aturan hari sekolah/jam tutup & weekend 24 jam).
 * - `false` → pemanggilan NONAKTIF total. Walaupun belum jam tutup / weekend, tetap TIDAK bisa memanggil.
 * Ini adalah kunci utama dari segalanya.
 */
export const PICKUP_ENABLED = true;

/**
 * FORCE ON pemanggilan (pengunci khusus admin).
 * - `true`  → walaupun sudah melewati jam tutup (MAX_PICKUP_TIME_WIB) di HARI SEKOLAH,
 *             pemanggilan TETAP bisa berjalan.
 * - `false` → normal; setelah lewat jam tutup di hari sekolah, pemanggilan berhenti.
 * HANYA berlaku untuk hari sekolah (Senin–Jumat). Tidak berlaku di akhir pekan.
 */
export const PICKUP_FORCE_ON = true;

/** Daftar batas waktu maksimal per metode (dummy) — opsional untuk penyesuaian. */
export const maxPickupTimePerMethod: Record<string, string> = {
  self: MAX_PICKUP_TIME_WIB,
  other: MAX_PICKUP_TIME_WIB,
  ojek: MAX_PICKUP_TIME_WIB,
};

export type Friend = { id: string; name: string; className: string };

export const friendClasses = ["7A", "7B", "8A", "8B", "9A", "9B"];

export const friends: Friend[] = [
  { id: "f1", name: "Ahmad Fathan", className: "8A" },
  { id: "f2", name: "Rizky Ramadhan", className: "8A" },
  { id: "f3", name: "Naufal Akbar", className: "9B" },
  { id: "f4", name: "Fauzan Malik", className: "7B" },
  { id: "f5", name: "Salsabila Putri", className: "7A" },
  { id: "f6", name: "Dimas Prayoga", className: "8B" },
  { id: "f7", name: "Aisyah Rahma", className: "9A" },
];

export type ClassSchedule = { masuk: string; pulang: string };

/** Jam masuk & pulang per tingkat kelas (berbeda tiap kelas). */
export const classSchedules: Record<string, ClassSchedule> = {
  "1": { masuk: "07.00", pulang: "11.30" },
  "2": { masuk: "07.00", pulang: "12.00" },
  "3": { masuk: "07.00", pulang: "12.30" },
  "4": { masuk: "06.45", pulang: "13.00" },
  "5": { masuk: "06.45", pulang: "13.30" },
  "6": { masuk: "06.45", pulang: "14.00" },
  "7": { masuk: "06.30", pulang: "14.30" },
  "8": { masuk: "06.30", pulang: "15.00" },
  "9": { masuk: "06.30", pulang: "15.30" },
};

const ROMAN: Record<string, string> = {
  I: "1", II: "2", III: "3", IV: "4", V: "5", VI: "6", VII: "7", VIII: "8", IX: "9",
};

/** Normalisasi "VII A" / "7A" -> tingkat "7". */
export function classLevel(className: string): string {
  const token = className.trim().toUpperCase().split(/[\s-]+/)[0];
  const digits = token.match(/^\d+/);
  if (digits) return digits[0];
  const roman = token.match(/^[IVX]+/);
  if (roman && ROMAN[roman[0]]) return ROMAN[roman[0]];
  return "";
}

export function scheduleFor(className: string): ClassSchedule {
  return classSchedules[classLevel(className)] ?? { masuk: "07.00", pulang: dismissalTime };
}

export function dismissalFor(className: string): string {
  return scheduleFor(className).pulang;
}
