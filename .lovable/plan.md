# Satukan kembali kartu GPS dan toggle Panggil Otomatis

Saat ini bagian GPS/jarak muncul sebagai kotak terpisah di bawah kartu toggle, sehingga terlihat seperti dua panel berbeda. Hasil yang diinginkan: tampilan seperti semula (satu kartu utuh), dengan bagian toggle di dalamnya, dan GPS hanya muncul setelah toggle dinyalakan.

## Yang akan diubah

File: `src/components/monitoring/AutoPickupGeofence.tsx`

- Gabungkan kembali menjadi **satu kartu** (satu border/rounded/shadow, latar gradien mengikuti status seperti desain awal).
- Di dalam kartu itu:
  - Blok radar + status + jarak berada di bagian atas, **hanya dirender saat toggle aktif**, muncul dengan animasi reveal (`animate-fade-in`).
  - Baris "Panggil Otomatis" + Switch berada di bawahnya sebagai bagian dari kartu yang sama (bukan kartu terpisah), persis seperti screenshot referensi: blok putih dengan ikon navigasi, judul, subjudul, dan switch di kanan.
  - Teks penjelasan tetap di bawah baris toggle.
- Saat toggle mati: kartu hanya berisi baris toggle + teks penjelasan (tanpa area GPS kosong), tetap terlihat rapi sebagai satu kartu.
- Confirm modal sebelum mengaktifkan tetap dipertahankan; mematikan toggle langsung menyembunyikan bagian GPS dan mereset state.
- Hapus offset `ml-[-5px]` / `ml-[-10px]` yang membuat perataan tidak rapi.

## Catatan teknis

Logika state (`state`, `distance`, `stepIndex`, efek GPS, dan auto-call) tidak diubah — hanya struktur JSX dan kelas styling. Tidak ada perubahan pada store atau alur data.
