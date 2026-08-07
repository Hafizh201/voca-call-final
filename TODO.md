# TODO — Perbaikan UX Notifikasi

## Tujuan
Membuat notifikasi lebih interaktif & berwarna (bukan putih polos), bisa di-close/dismiss, bisa di-swipe untuk hide, dan konsisten hilang di floating maupun halaman notifikasi. Menyediakan filter untuk menyembunyikan notif yang sudah dibaca.

## Langkah
- [x] 1. Perbarui store: tambah `dismissed` field + aksi `dismissNotification`, `toggleNotificationRead`, `restoreNotifications`.
- [x] 2. Buat komponen `SwipeableNotificationItem` (swipe-to-dismiss + tombol close).
- [x] 3. Perbarui `NotificationsFloating.tsx`: desain berwarna/interaktif, swipe + tombol close, filter cepat.
- [x] 4. Perbarui `routes/notifications.tsx`: pakai swipe item, segmented filter (Semua/Belum/Sudah), desain berwarna.
- [x] 5. Tambah animasi/utility di `styles.css` bila perlu.
- [x] 6. Verifikasi build & lint.
- [x] 7. Update Sonner toast di CallDeadlineWatcher & seluruh komponen:
  - Tambah `duration: Infinity` agar notif toast tidak auto-hilang.
  - Swipe-to-dismiss bawaan Sonner langsung berfungsi.
- [x] 8. Update konfigurasi Toaster di `__root.tsx` untuk mendukung swipe
  - `closeButton`, `duration: Infinity` untuk notif penting.
