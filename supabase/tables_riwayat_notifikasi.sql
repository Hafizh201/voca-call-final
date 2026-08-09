-- ============================================================
--  TABLES: type_panggil, riwayat_pemanggilan, notifikasi
--  For call history and notifications
-- ============================================================

-- ============================================================
-- 1) TABEL: type_panggil
-- ============================================================

create table if not exists public.type_panggil (
  id_jenis_pemanggilan integer primary key,
  jenis_pemanggilan text not null
);

-- Insert default types if table is empty
do $$
begin
  if not exists (select 1 from public.type_panggil limit 1) then
    insert into public.type_panggil (id_jenis_pemanggilan, jenis_pemanggilan) values
      (1, 'self'),
      (2, 'other'),
      (3, 'ojek'),
      (4, 'ditunggu'),
      (5, 'titipan');
  end if;
end $$;

-- ============================================================
-- 2) TABEL: riwayat_pemanggilan
-- ============================================================

create table if not exists public.riwayat_pemanggilan (
  id_riwayat bigint primary key,
  uid_siswa text not null,
  nama_siswa text not null,
  timestamp timestamp with time zone not null,
  kata_panggilan text,
  id_kelas text,
  kelas text,
  id_jenis_pemanggilan integer not null references public.type_panggil(id_jenis_pemanggilan)
);

-- ============================================================
-- 3) TABEL: notifikasi
-- ============================================================

create table if not exists public.notifikasi (
  id bigint primary key,
  id_riwayat bigint not null references public.riwayat_pemanggilan(id_riwayat),
  uid_siswa text not null,
  nama_siswa text not null,
  id_jenis_pemanggilan integer not null references public.type_panggil(id_jenis_pemanggilan),
  judul text not null,
  pesan text not null,
  kata_panggilan text not null,
  timestamp timestamp with time zone not null,
  dibaca boolean not null default false,
  dibeca_at timestamp with time zone null, -- typo? but we follow spec: dibaca_at
  diswipe boolean not null default false,
  diswipe_at timestamp with time zone null,
  aktif boolean not null default true
);

-- Note: column name dibaca_at (spec) but we wrote dibeca_at; fix:
-- We'll correct below.

-- Actually we need to correct: spec says dibaca_at and diswipe_at.
-- Let's recreate with correct columns.

drop table if exists public.notifikasi;
create table if not exists public.notifikasi (
  id bigint primary key,
  id_riwayat bigint not null references public.riwayat_pemanggilan(id_riwayat),
  uid_siswa text not null,
  nama_siswa text not null,
  id_jenis_pemanggilan integer not null references public.type_panggil(id_jenis_pemanggilan),
  judul text not null,
  pesan text not null,
  kata_panggilan text not null,
  timestamp timestamp with time zone not null,
  dibaca boolean not null default false,
  dibaca_at timestamp with time zone null,
  diswipe boolean not null default false,
  diswipe_at timestamp with time zone null,
  aktif boolean not null default true
);

-- RLS policies (optional, open for anon for simplicity)
drop policy if exists "anon baca type_panggil" on public.type_panggil;
create policy "anon baca type_panggil"
  on public.type_panggil
  for select
  using (true);

drop policy if exists "anon tulis type_panggil" on public.type_panggil;
create policy "anon tulis type_panggil"
  on public.type_panggil
  for insert
  with check (true);

drop policy if exists "anon ubah type_panggil" on public.type_panggil;
create policy "anon ubah type_panggil"
  on public.type_panggil
  for update
  using (true)
  with check (true);

-- riwayat_pemanggilan policies
drop policy if exists "anon baca riwayat_pemanggilan" on public.riwayat_pemanggilan;
create policy "anon baca riwayat_pemanggilan"
  on public.riwayat_pemanggilan
  for select
  using (true);

drop policy if exists "anon tulis riwayat_pemanggilan" on public.riwayat_pemanggilan;
create policy "anon tulis riwayat_pemanggilan"
  on public.riwayat_pemanggilan
  for insert
  with check (true);

drop policy if exists "anon ubah riwayat_pemanggilan" on public.riwayat_pemanggilan;
create policy "anon ubah riwayat_pemanggilan"
  on public.riwayat_pemanggilan
  for update
  using (true)
  with check (true);

-- notifikasi policies
drop policy if exists "anon baca notifikasi" on public.notifikasi;
create policy "anon baca notifikasi"
  on public.notifikasi
  for select
  using (true);

drop policy if exists "anon tulis notifikasi" on public.notifikasi;
create policy "anon tulis notifikasi"
  on public.notifikasi
  for insert
  with check (true);

drop policy if exists "anon ubah notifikasi" on public.notifikasi;
create policy "anon ubah notifikasi"
  on public.notifikasi
  for update
  using (true)
  with check (true);