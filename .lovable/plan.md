# Panggil Otomatis — Sembunyikan Deteksi GPS Sampai Toggle Menyala

## Perubahan di kartu beranda (AutoPickupGeofence)

Saat ini kartu deteksi lokasi (radar GPS, jarak ke sekolah, status "Tiba") selalu tampil bersama toggle "Panggil Otomatis".

Yang baru:

1. Secara default hanya bagian **Panggil Otomatis** (ikon navigasi, judul, keterangan, toggle) yang tampil. Toggle dalam kondisi **mati**.
2. Bagian GPS/radar (lingkaran lokasi, chip status, jarak ke sekolah, progress bar, pesan "Anda telah memasuki area sekolah") disembunyikan sepenuhnya.
3. Saat pengguna menyalakan toggle, muncul **modal konfirmasi** lebih dulu: menjelaskan bahwa lokasi akan dipantau dan permintaan penjemputan bisa terkirim otomatis saat masuk radius sekolah. Tombol: "Ya, aktifkan" / "Batal".
   - Jika Batal → toggle kembali mati, tidak ada yang muncul.
   - Jika Ya → toggle menyala dan bagian GPS **muncul dengan animasi reveal** (fade + slide/expand halus dari atas), lalu proses pencarian sinyal GPS dimulai dari awal.
4. Mematikan toggle langsung menyembunyikan kembali bagian GPS (tanpa konfirmasi) dan mereset status deteksi.

## Catatan teknis

- `AutoPickupGeofence.tsx`: `autoMode` default `false`; tambah state `confirmOpen`.
- Blok kartu deteksi (baris ~150-220) dibungkus kondisi `autoMode` dan diberi kelas animasi `animate-fade-in` (util yang sudah ada) plus transisi tinggi/opacity.
- Modal memakai `ConfirmDialog` yang sudah ada di `src/components/common/ConfirmDialog.tsx`.
- Efek pencarian GPS/progres jarak di-gate agar hanya berjalan saat `autoMode` aktif; saat dimatikan, state direset via fungsi `retry()` yang sudah ada.
- Kartu toggle dipindah keluar dari wrapper kartu GPS agar tetap tampil saat GPS disembunyikan; tata letak lain tidak diubah.
