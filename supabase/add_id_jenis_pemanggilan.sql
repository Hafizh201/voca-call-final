-- ============================================================
--  MIGRASI: Tambah kolom `id_jenis_pemanggilan`
--  ------------------------------------------------
--  Menghubungkan tabel-tabel panggil_* dengan tabel `type_panggil`
--  (id_jenis_pemanggilan):
--      1 = self, 2 = other, 3 = ojek,
--      4 = ditunggu, 5 = titipan
--
--  CARA PAKAI:
--   1) Supabase Dashboard -> SQL Editor
--   2) Tempel seluruh isi file ini lalu RUN.
--   (Dapat dijalankan berulang kali — idempoten.)
-- ============================================================

-- 1) panggil_self → id_jenis_pemanggilan = 1 (Self)
alter table if exists public.panggil_self
  add column if not exists id_jenis_pemanggilan integer;

-- 2) panggil_other → id_jenis_pemanggilan = 2 (Other)
alter table if exists public.panggil_other
  add column if not exists id_jenis_pemanggilan integer;

-- 3) panggil_ojek → id_jenis_pemanggilan = 3 (Ojek)
alter table if exists public.panggil_ojek
  add column if not exists id_jenis_pemanggilan integer;

-- 4) panggil_titipan → id_jenis_pemanggilan = 5 (Titipan)
alter table if exists public.panggil_titipan
  add column if not exists id_jenis_pemanggilan integer;

-- 5) panggil_ditunggu → id_jenis_pemanggilan = 4 (Ditunggu)
alter table if exists public.panggil_ditunggu
  add column if not exists id_jenis_pemanggilan integer;

-- Set default & nilai lama jika ada (agar tabel lama ikut terisi benar).
update public.panggil_self set id_jenis_pemanggilan = 1 where id_jenis_pemanggilan is null;
update public.panggil_other set id_jenis_pemanggilan = 2 where id_jenis_pemanggilan is null;
update public.panggil_ojek set id_jenis_pemanggilan = 3 where id_jenis_pemanggilan is null;
update public.panggil_titipan set id_jenis_pemanggilan = 5 where id_jenis_pemanggilan is null;
update public.panggil_ditunggu set id_jenis_pemanggilan = 4 where id_jenis_pemanggilan is null;
