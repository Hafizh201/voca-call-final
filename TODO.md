# TODO — Backend Call (Titipan & Ditunggu) + Cooldown & id_jenis_pemanggilan

## Persiapan
- [x] Analisis struktur database (kelas, siswa, users, panggil_*, type_panggil)
- [x] Analisis alur pickup (history.ts, simulator.ts, monitoring.tsx) sebagai pola backend
- [x] Analisis alur call (stores.ts, form, monitoring) yang masih UI lokal

## Database / SQL
- [x] Buat migrasi `supabase/add_id_jenis_pemanggilan.sql`:
      - ALTER TABLE panggil_self/other/ojek/titipan/ditunggu ADD COLUMN id_jenis_pemanggilan

## Backend riwayat (pickup)
- [x] `src/lib/pickup/history.ts`: bangun payload isi `id_jenis_pemanggilan` (self=1, other=2, ojek=3)
- [x] Ekspor `pushCctv` agar dipakai modul call

## Backend call (baru)
- [x] Buat `src/lib/call/history.ts` (tiru pola pickup/history.ts):
      - `insertCallHistory` → INSERT ke panggil_titipan (id=5) / panggil_ditunggu (id=4)
      - `updateCallCallCount` → UPDATE jumlah_pemanggilan (recall)
      - `markCallDone` → UPDATE done=true
      - `short_messg` = catatan user; `kata_panggilan` = teks lengkap

## Store call
- [x] `src/lib/call/stores.ts`: tambah cooldownStartedAt, callCount, idPemanggilan
- [x] `createCall`: set cooldown mulai sekarang + panggil insertCallHistory
- [x] Tambah `completeAndStartCooldown`, `triggerCallRecall`, `completeCall` update DB

## Halaman monitoring call
- [x] `call.monitoring.tsx`: tambah cooldown 3 menit + tombol "Panggil Lagi" (aktif saat habis) + sheet kalimat tambahan
- [x] Cooldown bertahan saat balik ke beranda (localStorage)

## Sticky bar notif
- [x] `StickyPickupBar.tsx`: tambah teks "Sudah bisa panggil ulang" saat cooldown habis
- [x] `StickyCallBar.tsx`: tambah info cooldown / bisa panggil ulang

## History page (koreksi)
- [x] `src/lib/call/history.ts`: tambah `fetchCallHistory` + tipe `CallHistoryItem` (ambil dari panggil_ditunggu & panggil_titipan)
- [x] `src/routes/history.tsx`: split menjadi 2 tab "Jemputan" / "Panggil"
      - Tab Jemputan → fetchPickupHistory (metode jemput)
      - Tab Panggil → fetchCallHistory (ditunggu & titipan)
      - Filter waktu & metode per tab, detail drawer dinamis
- [x] Konten 2 halaman bisa di-swipe kiri/kanan (carousel) + indikator titik di bawah

## Verifikasi
- [x] `npx tsc --noEmit` → TSC_EXIT=0 (tidak ada error)
