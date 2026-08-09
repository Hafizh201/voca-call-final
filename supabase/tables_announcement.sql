-- ============================================================
--  TABLE: announcement (Pengumuman Sekolah)
--  Untuk menampilkan pengumuman sekolah di dashboard.
--
--  Kolom:
--   id              : int8 (primary key, auto)
--   judul           : text (judul pengumuman)
--   isi             : text (isi/deskripsi pengumuman)
--   tanggal_mulai   : timestamptz (mulai tayang)
--   tanggal_selesai : timestamptz (selesai tayang)
--   aktif           : bool (aktif / nonaktif)
--   created_at      : timestamptz (default now())
--   updated_at      : timestamptz (default now())
--
--  CARA PAKAI:
--   1) Supabase Dashboard -> SQL Editor
--   2) Tempel seluruh isi file ini lalu RUN.
--   (Bisa dijalankan berulang kali — pakai CREATE TABLE IF NOT EXISTS.)
-- ============================================================

create table if not exists public.announcement (
  id bigint primary key generated always as identity,
  judul text,
  isi text,
  tanggal_mulai timestamp with time zone,
  tanggal_selesai timestamp with time zone,
  aktif boolean not null default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ============================================================
-- RLS POLICIES: announcement (terbuka untuk anon, sesuai login custom)
-- ============================================================
drop policy if exists "anon baca announcement" on public.announcement;
create policy "anon baca announcement"
  on public.announcement
  for select
  using (true);

drop policy if exists "anon tulis announcement" on public.announcement;
create policy "anon tulis announcement"
  on public.announcement
  for insert
  with check (true);

drop policy if exists "anon ubah announcement" on public.announcement;
create policy "anon ubah announcement"
  on public.announcement
  for update
  using (true)
  with check (true);

drop policy if exists "anon hapus announcement" on public.announcement;
create policy "anon hapus announcement"
  on public.announcement
  for delete
  using (true);

-- ============================================================
-- CATATAN KEAMANAN
-- ============================================================
-- Policy di atas terbuka untuk anon. Untuk produksi ketat,
-- ganti dengan policy berbasis auth.uid() / service_role.
-- Ini cukup untuk aplikasi yang memakai login custom.
-- ============================================================
