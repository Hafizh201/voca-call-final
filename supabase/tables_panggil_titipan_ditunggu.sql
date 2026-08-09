-- ============================================================
--  TABLES: panggil_titipan & panggil_ditunggu
--  For Panggil Titipan & Panggil Ditunggu features
-- ============================================================

-- ============================================================
-- 1) TABEL: panggil_titipan
-- ============================================================

create table if not exists public.panggil_titipan (
  id_pemanggilan bigint primary key,
  uid_siswa text not null,
  nama_siswa text not null,
  kelas text,
  id_kelas text,
  id_wali text not null,
  waktu_pemanggilan timestamp with time zone not null,
  nama_penitip text,
  jenis_titipan text,
  short_messg text,
  method text not null,
  jumlah_pemanggilan integer not null default 1,
  kata_panggilan text,
  done boolean not null default false,
  created_at timestamp with time zone default now()
);

-- ============================================================
-- 2) TABEL: panggil_ditunggu
-- ============================================================

create table if not exists public.panggil_ditunggu (
  id_pemanggilan bigint primary key,
  uid_siswa text not null,
  nama_siswa text not null,
  kelas text,
  id_kelas text,
  id_wali text not null,
  waktu_pemanggilan timestamp with time zone not null,
  ditunggu_oleh text not null,
  posisi_tunggu text not null,
  short_messg text,
  method text not null,
  jumlah_pemanggilan integer not null default 1,
  kata_panggilan text,
  done boolean not null default false,
  created_at timestamp with time zone default now()
);


-- ============================================================
-- RLS POLICIES: panggil_titipan
-- ============================================================

drop policy if exists "anon baca panggil_titipan" on public.panggil_titipan;
create policy "anon baca panggil_titipan"
  on public.panggil_titipan
  for select
  using (true);

drop policy if exists "anon tulis panggil_titipan" on public.panggil_titipan;
create policy "anon tulis panggil_titipan"
  on public.panggil_titipan
  for insert
  with check (true);

drop policy if exists "anon ubah panggil_titipan" on public.panggil_titipan;
create policy "anon ubah panggil_titipan"
  on public.panggil_titipan
  for update
  using (true)
  with check (true);


-- ============================================================
-- RLS POLICIES: panggil_ditunggu
-- ============================================================

drop policy if exists "anon baca panggil_ditunggu" on public.panggil_ditunggu;
create policy "anon baca panggil_ditunggu"
  on public.panggil_ditunggu
  for select
  using (true);

drop policy if exists "anon tulis panggil_ditunggu" on public.panggil_ditunggu;
create policy "anon tulis panggil_ditunggu"
  on public.panggil_ditunggu
  for insert
  with check (true);

drop policy if exists "anon ubah panggil_ditunggu" on public.panggil_ditunggu;
create policy "anon ubah panggil_ditunggu"
  on public.panggil_ditunggu
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