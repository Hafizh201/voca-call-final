import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { createStore, sessionStore } from "./stores";

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  /** Sudah dibaca tidak lagi ada di inbox; tetap tersimpan pada Arsip. */
  archived: boolean;
};

type NotificationMap = Record<string, AppNotification[]>;
const EMPTY: AppNotification[] = [];
const notificationStore = createStore<NotificationMap>("panggil.notifications.by-user", {});

function currentUserKey() {
  // Username dipakai sebagai namespace lokal. Notifikasi satu akun tidak
  // pernah masuk ke inbox akun lain pada perangkat yang sama.
  return sessionStore.get().username ?? "__anonymous__";
}

function getCurrentItems(): AppNotification[] {
  const state = notificationStore.get();
  return Array.isArray(state) ? EMPTY : state[currentUserKey()] ?? EMPTY;
}

function setCurrentItems(items: AppNotification[]) {
  const state = notificationStore.get();
  const map = Array.isArray(state) ? {} : state;
  notificationStore.set({ ...map, [currentUserKey()]: items });
}

function subscribeCurrent(listener: () => void) {
  const unsubscribeNotifications = notificationStore.subscribe(listener);
  const unsubscribeSession = sessionStore.subscribe(listener);
  return () => {
    unsubscribeNotifications();
    unsubscribeSession();
  };
}

export const useNotifications = () =>
  useSyncExternalStore(subscribeCurrent, getCurrentItems, () => EMPTY);

export function pushNotification(input: Omit<AppNotification, "id" | "read" | "archived">) {
  setCurrentItems([{ ...input, id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, read: false, archived: false }, ...getCurrentItems()]);
}

type NoticeTone = "success" | "error" | "info";

export function notify(title: string, body = "", tone: NoticeTone = "info") {
  pushNotification({ title, body: body || title, time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) });
  toast[tone](title, body ? { description: body } : undefined);
}

/** Membaca notifikasi juga memindahkannya dari Inbox ke Arsip. */
export function markNotificationRead(id: string) {
  setCurrentItems(getCurrentItems().map((item) => item.id === id ? { ...item, read: true, archived: true } : item));
}

export function markAllNotificationsRead() {
  setCurrentItems(getCurrentItems().map((item) => item.archived ? item : { ...item, read: true, archived: true }));
}

/** Hapus permanen hanya dari akun aktif. */
export function removeNotification(id: string) {
  setCurrentItems(getCurrentItems().filter((item) => item.id !== id));
}

export function clearNotifications() {
  setCurrentItems([]);
}
