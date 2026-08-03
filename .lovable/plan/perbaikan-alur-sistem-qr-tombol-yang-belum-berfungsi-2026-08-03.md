# Perbaikan alur Sistem QR + tombol yang belum berfungsi

## Masalah utama (penyebab QR tidak muncul)

Data isian form penjemputan disimpan di sebuah variabel di dalam file halaman form (`pickup.form.$method.tsx`) dan dibaca ulang oleh halaman Ringkasan lewat impor langsung. Karena setiap halaman dimuat sebagai bundel terpisah, halaman Ringkasan membaca salinan variabel yang masih kosong — sehingga pilihan "Sistem QR" hilang dan selalu kembali ke nilai bawaan "Sudah Sampai". Akibatnya permintaan terkirim tanpa kode QR dan halaman monitoring tidak pernah masuk mode QR.

## Yang akan diperbaiki

1. **Pindahkan draft form ke penyimpanan bersama**
   - Buat `src/lib/pickup/draft.ts` sebagai satu-satunya sumber data draft (tersimpan juga ke localStorage lewat pola store yang sudah ada).
   - Halaman form menulis draft ke sana; halaman Ringkasan membacanya dari sana. Hapus ekspor `getDraft` dari file rute.
   - Hasil: memilih "Sistem QR" tetap terbaca di Ringkasan ("Sistem QR (dipindai saat tiba)") dan kode QR benar-benar dibuat saat kirim.

2. **Perjelas status pilihan QR di form**
   - Tombol "Sistem QR" tampil aktif/terpilih setelah dialog panduan disetujui, dan draft langsung tersimpan saat berubah (tidak menunggu tombol Lanjut).

3. **Monitoring mode QR**
   - Verifikasi ulang: bila `estimate = qr`, halaman monitoring hanya menampilkan QR + kode + status pindaian + tombol simulasi; bila "sudah sampai"/menit, tampilan monitoring biasa tanpa QR.
   - Tombol "Simulasikan scan" juga memajukan tahapan pemanggilan (queued → announcing → done) agar terasa nyata, dan setelah selesai menyediakan tombol "Selesai" untuk mengarsipkan penjemputan.

4. **Sapu bersih tombol/elemen yang tidak berfungsi**
   - Telusuri seluruh halaman (dashboard, profil, pengaturan, notifikasi, riwayat, presensi, sekolah, bantuan, data anak, trusted pickup) dan pastikan setiap tombol punya aksi nyata.
   - Yang belum bertindak akan diberi fungsi lokal yang wajar: notifikasi bisa ditandai terbaca / hapus semua, riwayat bisa dibuka detailnya, presensi bisa difilter per anak, pengaturan aksesibilitas mendapat kontrol nyata (ukuran teks, kontras) yang tersimpan di pengaturan.
   - Halaman yang benar-benar belum ada isinya akan diberi label jelas "belum tersedia" tanpa tombol palsu, bukan tombol mati.

## Catatan teknis

- Draft disimpan lewat `createStore` yang sudah ada di `src/lib/state/stores.ts` agar tahan reload dan tidak terpengaruh code-splitting rute.
- Tidak ada perubahan backend; semua tetap state lokal/dummy sesuai proyek saat ini.
- Setelah perubahan: cek tipe (tsgo) dan uji alur di preview (form → QR → ringkasan → monitoring → simulasi scan).
