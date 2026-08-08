# TODO — Riwayat pemanggilan ke Supabase

## Selesai
- [x] Tambah field `idKelas` ke tipe `Student` (dari `siswa.kelas_id`)
- [x] Tambah field `idPemanggilan` ke `PickupRequest` (referensi record riwayat)
- [x] Modul baru `src/lib/pickup/history.ts`:
  - `resolveWaliId(username)` → users.id (UUID)
  - `insertPickupHistory(req)` → INSERT ke panggil_self/other/ojek sesuai method
  - `updatePickupCallCount(req)` → UPDATE jumlah_pemanggilan pada row yang sama
  - `markPickupDone(req)` → UPDATE done=true pada row yang sama
- [x] Wiring di `simulator.ts`:
  - `submitPickup` → insert
  - `triggerSecondCall` → update jumlah_pemanggilan (bukan insert baru)
  - `finishAndArchive` & `forceStopActivePickup` → mark done
- [x] Typecheck `npx tsc --noEmit` → DONE=0 (tidak ada error TS)

## Catatan
- Semua INSERT/UPDATE fire & forget; error hanya di-`console.error`, tidak menghentikan alur utama.
- `id_pemanggilan` saat INSERT default = `req.id`; setelah INSERT berhasil disimpan ke state aktif untuk UPDATE recall/done pada row yang sama.
- Tidak ada perubahan schema/.env/RLS/Supabase config.
