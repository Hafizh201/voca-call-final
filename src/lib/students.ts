import { useQuery } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/state/stores";

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

const AVATAR_COLORS = [
  "oklch(0.65 0.15 40)",
  "oklch(0.68 0.14 340)",
  "oklch(0.68 0.15 200)",
  "oklch(0.6 0.16 90)",
  "oklch(0.62 0.14 280)",
  "oklch(0.66 0.15 150)",
  "oklch(0.63 0.14 25)",
  "oklch(0.7 0.13 320)",
];

/**
 * Ambil data siswa dari database online (Supabase) untuk wali murid yang sedang
 * login.
 *
 * Struktur yang dipakai (schema yang SUDAH ADA, tidak ada perubahan DB):
 *  - tabel `users`  : `id`, `username`, `nama_walmur`, `pin`, `status_user`
 *  - tabel `siswa`  : `id`, `user_id1`, `user_id2`, `nama`, `nis`, `kelas_id`,
 *                     `nick`, `presensi_pulang`, `senin_ex..jumat_ex`
 *  - tabel `kelas`  : `id`, `nama_kelas`, `senin_pulang..jumat_pulang`
 *
 * Relasi:
 *  - siswa.kelas_id -> kelas.id
 *  - siswa dipunyai oleh user bila user_id1 = user.id ATAU user_id2 = user.id
 *    (kedua relasi diperiksa, bukan hanya user_id1).
 *
 * Hanya siswa yang memiliki nama (bukan null / string kosong) yang dikembalikan.
 * Jumlah siswa tidak dibatasi — jika ada lebih dari 3 siswa, semuanya dikembalikan.
 */
export async function fetchStudents(username: string | null): Promise<Student[]> {
  if (!username) return [];

  // Dapatkan id user yang sedang login berdasarkan username.
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("username", username)
    .single();

  if (userError || !userData) return [];
  const userId = userData.id;

  // Ambil semua siswa milik user tersebut (user_id1 ATAU user_id2), beserta
  // nama kelas & jadwal kepulangan lewat relasi siswa.kelas_id -> kelas.id.
  const { data, error } = await supabase
    .from("siswa")
    .select(
      "id, nama, nis, kelas_id, nick, presensi_pulang, \
       kelas:kelas_id(id, nama_kelas, senin_pulang, selasa_pulang, rabu_pulang, kamis_pulang, jumat_pulang)"
    )
    .or(`user_id1.eq.${userId},user_id2.eq.${userId}`);

  if (error || !data) return [];

  return data
    .filter((s) => typeof s.nama === "string" && s.nama.trim().length > 0)
    .map((s, i) => {
      // Relasi kelas dikembalikan sebagai array oleh Supabase; ambil elemen pertama.
      const kls = Array.isArray(s.kelas) ? s.kelas[0] : s.kelas;
      return {
        id: String(s.id),
        name: s.nama.trim(),
        nickname: (s.nick && String(s.nick).trim()) || s.nama.trim().split(/\s+/)[0],
        className: (kls?.nama_kelas as string | undefined)?.trim() || "",
        nis: (s.nis as string | undefined)?.trim() || "",
        avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
        attendanceStatus: "belum" as const,
        dismissStatus: s.presensi_pulang ? ("sudah" as const) : ("belum" as const),
        dismissedAt: s.presensi_pulang ? "Sudah" : undefined,
        pendingApproval: false,
      };
    });
}

// ============ Sinkron cache (untuk modul non-React seperti simulator) ============
let cachedStudents: Student[] = [];
const listeners = new Set<() => void>();

export function getStudents(): Student[] {
  return cachedStudents;
}

export function setStudents(s: Student[]) {
  cachedStudents = s;
  listeners.forEach((l) => l());
}

export function subscribeStudents(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useStudentsCache() {
  return useSyncExternalStore(subscribeStudents, getStudents, () => []);
}

/**
 * Hook utama untuk mengambil data siswa dari Supabase.
 * Data otomatis mengikuti jumlah siswa yang benar-benar tersedia di database.
 * Diperbarui melalui kedua relasi (user_id1 & user_id2).
 */
export function useStudents() {
  const session = useSession();
  const query = useQuery({
    queryKey: ["students", session.username],
    queryFn: async () => {
      const built = await fetchStudents(session.username);
      setStudents(built);
      return built;
    },
    enabled: !!session.username,
    staleTime: 60_000,
  });

  return {
    students: query.data ?? getStudents(),
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

