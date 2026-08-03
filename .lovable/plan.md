# Port voca-system + Halaman Monitoring Mode QR

## Tahap 1 — Pindahkan aplikasi ke proyek ini

Proyek Lovable ini masih kosong. Seluruh aplikasi `voca-system` dari GitHub disalin ke sini apa adanya lebih dulu (tanpa perubahan perilaku), supaya perbaikan bisa dikerjakan dan dilihat langsung di preview:

- Semua halaman: login/PIN, dashboard, pickup (method, select, form, preview, waiting, complete), monitoring, history, notifications, profile, settings, school, children, help, privacy, dll.
- Komponen (layout, cards, pickup, monitoring, feedback, common), state store lokal, simulator penjemputan, data dummy, dan `styles.css` (tema/token warna asli).
- Dependensi tambahan yang dipakai repo (mis. pembuat QR code) dipasang.

Data tetap dummy + localStorage seperti di repo (belum pakai backend).

## Tahap 2 — Monitoring khusus mode QR

Di halaman pickup form, opsi metode kedatangan punya 3 pilihan: perkiraan menit, "sudah sampai", dan sistem QR. Saat ini halaman monitoring menampilkan semua blok (status, timeline, status sistem, presensi, tombol panggil ulang) untuk semua opsi.

Perubahan:

**Jika opsi QR dipilih** — halaman monitoring hanya berisi:
1. QR code besar di tengah layar (fokus utama, satu layar penuh).
2. Kode pemanggilan (mis. `PJ-XXXX`) di bawah QR.
3. Instruksi singkat: tunjukkan/berikan kode ini kepada penjemput.
4. Tombol **Bagikan** (Web Share, fallback salin) dan **Salin tautan**.
5. Di paling bawah: keterangan status scan — "Belum dipindai" atau "Sudah dipindai N kali" beserta waktu pindai terakhir.
6. Tombol dummy **Simulasikan scan** untuk menambah hitungan scan (khusus simulator/demo).

Semua blok lain (timeline aktivitas, status sistem, pratinjau pengumuman, presensi pulang, cooldown, panggil lagi) disembunyikan pada mode QR.

**Jika opsi menit atau "sudah sampai" dipilih** — tidak ada QR sama sekali di monitoring; tampilan tetap seperti sekarang.

## Catatan teknis

- Mode QR ditentukan dari `qrCode` pada permintaan aktif (diisi simulator saat `estimate === "qr"`); kondisi ini dipakai untuk memilih antara tampilan monitoring QR-only dan tampilan normal.
- State scan (`scanCount`, `lastScannedAt`) ditambahkan ke `PickupRequest` di store lokal, plus aksi `simulateScan()` di `src/lib/pickup/simulator.ts`.
- Tampilan QR-only dibuat sebagai komponen terpisah (`QrOnlyMonitoring`) agar `monitoring.tsx` tetap ringkas; `QrTicket.tsx` yang ada dipakai ulang/di-extend.
- Tautan yang dibagikan/disalin berupa URL berisi kode penjemputan (mis. `/monitoring?code=PJ-XXXX`) — masih dummy, belum ada verifikasi server.
