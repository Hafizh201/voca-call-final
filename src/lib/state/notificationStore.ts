import { useSyncExternalStore } from "react";
import { createStore } from "./stores";
import { notifications as seedNotifications } from "@/lib/dummy/data";

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  dismissed?: boolean;
};

type NotifState = AppNotification[];

const notifInitial: NotifState = seedNotifications.map((n) => ({ ...n }));

export const notificationStore = createStore<NotifState>(
  "panggil.notifications",
  notifInitial,
);

/** Pastikan state yang dibaca selalu berupa array (amankan dari data lama yang korup). */
function safeSnapshot(): NotifState {
  const s = notificationStore.get();
  return Array.isArray(s) ? s : notifInitial;
}

export const useNotifications = () =>
  useSyncExternalStore(
    notificationStore.subscribe,
    safeSnapshot,
    () => notifInitial,
  );

/** Ambil state sebagai array (aman walau data lama korup). */
function getSafeItems(): AppNotification[] {
  const s = notificationStore.get();
  return Array.isArray(s) ? s : notifInitial;
}

/** Tambah notifikasi baru di urutan teratas. */
export function pushNotification(input: Omit<AppNotification, "id" | "read">) {
  const items = getSafeItems();
  notificationStore.set([
    { ...input, id: `notif-${Date.now()}`, read: false },
    ...items,
  ]);
}

export function markNotificationRead(id: string) {
  const items = getSafeItems();
  notificationStore.set(
    items.map((n) => (n.id === id ? { ...n, read: true } : n)),
  );
}

export function markAllNotificationsRead() {
  const items = getSafeItems();
  notificationStore.set(items.map((n) => ({ ...n, read: true })));
}

export function deleteNotification(id: string) {
  const items = getSafeItems();
  notificationStore.set(items.filter((n) => n.id !== id));
}

export function clearNotifications() {
  notificationStore.set([]);
}

/** Tandai notifikasi sebagai di-dismiss (hilang dari semua tampilan). */
export function dismissNotification(id: string) {
  const items = getSafeItems();
  notificationStore.set(items.filter((n) => n.id !== id));
}

/** Toggle status baca (read/unread) pada satu notifikasi. */
export function toggleNotificationRead(id: string) {
  const items = getSafeItems();
  notificationStore.set(
    items.map((n) => (n.id === id ? { ...n, read: !n.read } : n)),
  );
}

/** Kembalikan notifikasi yang sebelumnya di-dismiss (undo). */
export function restoreNotifications() {
  const items = getSafeItems();
  notificationStore.set(items.map((n) => ({ ...n, dismissed: false })));
}

/** Daftar notifikasi yang aktif (tidak di-dismiss). */
export function activeNotifications(): AppNotification[] {
  return getSafeItems().filter((n) => !n.dismissed);
}
