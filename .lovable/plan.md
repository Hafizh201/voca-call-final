# Perbaikan Lokasi Jemput, Panggil Otomatis, & Notifikasi

## 1. Lokasi penjemputan jadi dropdown
Di form penjemputan (metode "Dijemput Sendiri"), field "Lokasi menunggu" yang sekarang berupa textbox diganti menjadi pilihan tetap: Gerbang Utama, Gerbang Belakang, Area Parkir, Pos Satpam, Lobi Sekolah. Nilai default tetap Gerbang Utama, dan teks pemanggilan otomatis ikut menyesuaikan.

## 2. Panggil Otomatis: wajib pilih anak dulu
- Saat toggle "Panggil Otomatis" dinyalakan, modal konfirmasi berubah jadi **sheet dari bawah** yang menutupi kira-kira setengah layar (bukan dialog di tengah).
- Isi sheet: judul singkat, daftar nama ananda yang bisa dipilih (bisa lebih dari satu), lalu tombol "Aktifkan".
- Pemilihan anak bersifat wajib — tombol aktifkan nonaktif selama belum ada anak dipilih.
- Kalau dibatalkan, toggle kembali mati.
- Nama anak yang dipilih ditampilkan di kartu Panggil Otomatis saat mode aktif.
- Perapian tampilan: jarak, radar, chip status, dan baris toggle tetap dalam satu kartu, dengan spasi dan hierarki teks yang lebih rapi.

## 3. Setelah tiba: tombol preview panggilan + notifikasi
Ketika status GPS mencapai "tiba di area sekolah":
- Muncul notifikasi (toast) "Ananda sudah dipanggil".
- Muncul tombol "Lihat Halaman Pemanggilan" yang membuka halaman monitoring/pemanggilan aktif.

## 4. Notifikasi jadi panel mengambang di dashboard
- Di pojok dashboard ditambahkan tombol lonceng mengambang dengan badge jumlah belum dibaca.
- Diklik: terbuka kotak kecil mengambang berisi beberapa notifikasi terbaru, dengan tombol interaktif (tandai dibaca, hapus, "Lihat semua" ke halaman notifikasi).
- Panel bisa ditutup dengan klik di luar atau tombol tutup, dengan animasi halus dan tampilan responsif.

## Catatan teknis
- `src/components/pickup/Fields.tsx`: pakai `SelectField` untuk lokasi (atau tambah dropdown ringan), dipakai di `src/routes/pickup.form.$method.tsx`.
- Komponen baru `src/components/common/BottomSheet.tsx` untuk modal setengah layar (dipakai untuk pemilihan anak).
- `src/components/monitoring/AutoPickupGeofence.tsx`: state `selectedChildren`, gating aktivasi, tombol preview + `toast` saat state `arrived`.
- Komponen baru `src/components/notifications/NotificationsFloating.tsx`, dipasang di `src/routes/dashboard.tsx`, memakai data dari `src/lib/dummy/data.ts` dan state lokal.
- Semua warna memakai token desain yang sudah ada; tanpa perubahan backend.
