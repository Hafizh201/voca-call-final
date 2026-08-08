# TODO — Perbaikan & peningkatan riwayat pemanggilan

## Riwayat Supabase (selesai)
- [x] INSERT riwayat saat submit (fire & forget)
- [x] UPDATE jumlah_pemanggilan saat recall (row sama)
- [x] UPDATE done=true saat selesai (row sama)
- [x] RLS policy (`supabase/rls-pemicu.sql`) untuk panggil_self/other/ojek
- [x] CCTV panel debug (INSERT/UPDATE/tabel/error/id/jumlah)

## Peningkatan baru (selesai)
- [x] `waktu_pemanggilan` sekarang dikirim dalam WIB (+07:00)
- [x] `nama_siswa` menampung SEMUA siswa dalam satu kolom, dipisah koma
- [x] Halaman Riwayat (`/history`) terhubung ke database Supabase via `fetchPickupHistory()`
- [x] Halaman Riwayat menampilkan state loading, hapus data (refresh), dan filter tanggal
- [x] Verifikasi typecheck (`npx tsc --noEmit` → DONE=0)

## Catatan
- Format id_pemanggilan: BIGINT numerik (timestamp), bukan string `req-...`
- nama_siswa di kolom DB berisi mis. "Ali, Budi, Citra" (bisa `.split(", ")`)
