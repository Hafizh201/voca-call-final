# TODO — Fitur Panggil Ditunggu & Ambil Titipan

## Fitur baru "Panggil" (UI/UX dulu, backend menyusul)
- [x] Investigasi struktur pickup flow, form, router, monitoring, dashboard
- [x] Buat `src/lib/call/stores.ts` — store status aktif (ditunggu/titipan) + flag done/taken
- [x] Buat `src/routes/call.method.tsx` (`/call/method`) — pilihan "Ambil Titipan" / "Panggil Ditunggu" (copy desain pickup.method)
- [x] Buat `src/routes/call.form.$type.tsx` (`/call/form/$type`) — form dinamis kedua jenis
  - `ditunggu`: ditunggu_oleh, posisi_tunggu, short_messg
  - `titipan`: nama_penitip, jenis_titipan, short_messg
  - Tanpa teks pemanggilan
  - Tanpa recall/cooldown untuk titipan
- [x] Ganti tombol "Presensi Hari Ini" di dashboard → tombol "Panggil" → `/call/method`
- [x] Monitoring: tambah tombol "Kembali ke Beranda"
- [x] Pop-up dashboard: status "sudah diambil / belum" untuk titipan (CallStatusCard)

## Verifikasi
- [x] `npx tsc --noEmit` → TSC_EXIT=0 (tidak ada error)
- [x] Route baru terdaftar di routeTree.gen.ts (dev server regenerate)

## Backend (menyusul / tahap berikutnya)
- [ ] INSERT ke `panggil_ditunggu` / `panggil_titipan` saat submit
- [ ] Update status done/taken ke database
