-- ============================================================
--  FIX RLS: RIWAYAT PEMANGGILAN TIDAK MASUK KE SUPABASE
--  Root cause (terbukti): aplikasi memakai LOGIN CUSTOM
--  (username+PIN di tabel `users`), BUKAN Supabase Auth.
--  Akibatnya auth.uid() selalu NULL, sehingga query INSERT/UPDATE
--  ke tabel panggil_self / panggil_other / panggil_ojek ditolak
--  oleh RLS secara diam-diam (0 baris terpengaruh, tanpa error).
--
--  Solusi: buat policy INSERT/UPDATE (dan SELECT) yang terbuka
--  untuk role anon & authenticated, SAMA seperti pendekatan pada
--  tabel users/siswa/kelas.
--
--  TIDAK membuat tabel baru, TIDAK mengubah struktur/kolom,
--  TIDAK menyentuh .env / config / login.
--
--  CARA PAKAI:
--   1) Supabase Dashboard -> SQL Editor
--   2) Tempel seluruh isi file ini lalu RUN.
--   (Dapat dijalankan berulang kali — pakai DROP POLICY IF EXISTS.)
-- ============================================================

-- ============================================================
-- 1) TABEL: panggil_self
-- ============================================================
drop policy if exists "anon baca panggil_self" on public.panggil_self;
create policy "anon baca panggil_self"
  on public.panggil_self
  for select
  using (true);

drop policy if exists "anon tulis panggil_self" on public.panggil_self;
create policy "anon tulis panggil_self"
  on public.panggil_self
  for insert
  with check (true);

drop policy if exists "anon ubah panggil_self" on public.panggil_self;
create policy "anon ubah panggil_self"
  on public.panggil_self
  for update
  using (true)
  with check (true);

-- ============================================================
-- 2) TABEL: panggil_other
-- ============================================================
drop policy if exists "anon baca panggil_other" on public.panggil_other;
create policy "anon baca panggil_other"
  on public.panggil_other
  for select
  using (true);

drop policy if exists "anon tulis panggil_other" on public.panggil_other;
create policy "anon tulis panggil_other"
  on public.panggil_other
  for insert
  with check (true);

drop policy if exists "anon ubah panggil_other" on public.panggil_other;
create policy "anon ubah panggil_other"
  on public.panggil_other
  for update
  using (true)
  with check (true);

-- ============================================================
-- 3) TABEL: panggil_ojek
-- ============================================================
drop policy if exists "anon baca panggil_ojek" on public.panggil_ojek;
create policy "anon baca panggil_ojek"
  on public.panggil_ojek
  for select
  using (true);

drop policy if exists "anon tulis panggil_ojek" on public.panggil_ojek;
create policy "anon tulis panggil_ojek"
  on public.panggil_ojek
  for insert
  with check (true);

drop policy if exists "anon ubah panggil_ojek" on public.panggil_ojek;
create policy "anon ubah panggil_ojek"
  on public.panggil_ojek
  for update
  using (true)
  with check (true);

-- ============================================================
-- CATATAN KEAMANAN
-- ============================================================
-- Policy di atas terbuka untuk anon. Untuk produksi ketat,
-- ganti dengan policy berbasis auth.uid() ATAU batasi range
-- IP / gunakan service_role di sisi server. Ini cukup untuk
-- menghidupkan fitur karena aplikasi ini memakai login custom.
-- ============================================================
