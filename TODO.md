# TODO — Sinkronisasi data siswa (filter + guard + empty state)

## Goals
- Jumlah siswa di UI otomatis mengikuti jumlah data siswa valid di `students`
- Tidak menampilkan slot kosong/placeholder/nama null
- Tidak crash saat `students` kosong
- Tidak mengubah Supabase/.env/auth/RLS/schema
- Tidak mengubah UI/UX existing

## Steps
- [x] `children.tsx`: filter siswa valid + empty state
- [x] `attendance-today.tsx`: filter siswa valid + empty state
- [x] `dashboard.tsx`: guard hero card saat daftar kosong
- [x] `pickup.select.tsx`: guard `active[0]` + empty state
- [x] `pickup.form.$method.tsx`: guard `[0].id` saat daftar kosong
- [x] `StudentHeroCard.tsx`: bersihkan artefak komentar "SISWA 2/3"
- [x] Build `vite build` sukses tanpa error TS/TSX
