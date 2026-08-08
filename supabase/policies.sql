-- ============================================================
--  FIX RLS: data siswa & kelas tidak muncul di website
--  Root cause (terbukti via CCTV + kontrol RLS):
--    tabel `siswa` (dan `kelas`) memblokir SELECT untuk
--    anon/public role, sehingga `select * from siswa`
--    mengembalikan 0 baris TANPA error.
--
--  Kontrol CCTV menunjukkan: users>0, siswa=0, kelas=(0/ERR)
--  dengan KLIEN/KEY yang SAMA → sudah pasti RLS per-tabel.
--
--  Aplikasi memakai LOGIN CUSTOM (username+PIN di `users`),
--  bukan Supabase Auth → auth.uid() selalu NULL, jadi policy
--  berbasis auth.uid() TIDAK akan jalan.
--
--  Solusi: buat `siswa` & `kelas` bisa dibaca anon/public,
--  SAMA seperti tabel `users` yang sudah terbaca.
--
--  CARA PAKAI:
--   1) Buka Supabase Dashboard -> SQL Editor
--   2) Tempel seluruh isi file ini lalu RUN.
--   (Bisa dijalankan berulang kali — pakai DROP IF EXISTS.)
--
--  Setelah itu: reload aplikasi -> STEP C harus menunjukkan
--  JUMLAH SISWA > 0, dan dashboard/Data Anak menampilkan siswa.
-- ============================================================

-- 1) Hapus policy lama (jika ada) lalu buat policy baru.
drop policy if exists "anon baca siswa" on public.siswa;
create policy "anon baca siswa"
  on public.siswa
  for select
  using (true);

-- 2) Tabel kelas
drop policy if exists "anon baca kelas" on public.kelas;
create policy "anon baca kelas"
  on public.kelas
  for select
  using (true);

-- 3) Jika tabel `users` belum punya policy terbuka (untuk konsistensi),
--    tambahkan juga. (Opsional — kalau sudah terbaca, boleh dilewati.)
-- drop policy if exists "anon baca users" on public.users;
-- create policy "anon baca users"
--   on public.users
--   for select
--   using (true);
