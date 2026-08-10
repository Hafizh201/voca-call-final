import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { createStore } from "./stores";
import { notifications as seedNotifications } from "@/lib/dummy/data";

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
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

type NoticeTone = "success" | "error" | "info";

/** Simpan setiap pemberitahuan ke inbox sebelum menampilkannya sebagai toast sementara. */
export function notify(title: string, body = "", tone: NoticeTone = "info") {
  pushNotification({
    title,
    body: body || title,
    time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
  });
  toast[tone](title, body ? { description: body } : undefined);
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

export function clearNotifications() {
  notificationStore.set([]);
}

/** Toggle status baca (read/unread) pada satu notifikasi. */
export function toggleNotificationRead(id: string) {
  const items = getSafeItems();
  notificationStore.set(
    items.map((n) => (n.id === id ? { ...n, read: !n.read } : n)),
  );
}

