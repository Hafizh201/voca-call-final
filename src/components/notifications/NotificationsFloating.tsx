import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, Check, CheckCheck, Inbox, Mail, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/state/notificationStore";
import type { AppNotification } from "@/lib/state/notificationStore";

type Filter = "semua" | "belum";

const READ_SWIPE_THRESHOLD = 72;

/** Item inbox permanen: geser ke kiri hanya menandai sudah dibaca, tidak menghapusnya. */
export function NotificationInboxItem({ notification, compact }: { notification: AppNotification; compact?: boolean }) {
  const startX = useRef<number | null>(null);
  const [offset, setOffset] = useState(0);

  const markRead = () => {
    if (!notification.read) markNotificationRead(notification.id);
  };

  const finishSwipe = () => {
    const shouldMarkRead = offset <= -READ_SWIPE_THRESHOLD;
    startX.current = null;
    if (shouldMarkRead) markRead();
    setOffset(0);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="absolute inset-y-0 right-0 flex w-28 items-center justify-center bg-success/15 text-[10px] font-bold text-success-foreground">
        <Check className="mr-1 h-3.5 w-3.5" /> Tandai dibaca
      </div>
      <button
        type="button"
        onClick={markRead}
        onPointerDown={(event) => {
          startX.current = event.clientX;
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (startX.current === null) return;
          const distance = event.clientX - startX.current;
          if (distance < 0) setOffset(Math.max(distance, -READ_SWIPE_THRESHOLD - 28));
        }}
        onPointerUp={finishSwipe}
        onPointerCancel={finishSwipe}
        style={{ transform: `translateX(${offset}px)` }}
        className={cn(
          "relative flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left shadow-card transition-transform duration-200 ease-out active:scale-[0.99]",
          notification.read
            ? "border-border/60 bg-surface/70"
            : "border-primary/20 bg-gradient-to-br from-primary/10 via-surface to-surface shadow-glow",
        )}
      >
        {!compact && (
          <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-2xl", notification.read ? "bg-surface-2 text-muted-foreground" : "bg-gradient-to-br from-primary to-oklch(0.45 0.11 275) text-white shadow-glow")}>
            <Bell className="h-4 w-4" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className={cn("truncate font-display text-[13px]", notification.read ? "font-semibold text-muted-foreground" : "font-bold text-ink")}>{notification.title}</span>
            {notification.read ? <Check className="h-3.5 w-3.5 shrink-0 text-success" /> : <span className="h-2 w-2 shrink-0 rounded-full bg-primary shadow-glow" />}
          </span>
          <span className="mt-0.5 block text-[11px] text-muted-foreground">{notification.body}</span>
          <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{notification.time}</span>
        </span>
      </button>
    </div>
  );
}

export function NotificationsFloating() {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("semua");
  const all = useNotifications();
  const ref = useRef<HTMLDivElement>(null);

  const items = all.filter((n) => (filter === "belum" ? !n.read : true));
  const unread = all.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifikasi"
        aria-expanded={open}
        className={cn(
          "relative grid h-10 w-10 place-items-center rounded-2xl shadow-card transition active:scale-95",
          open
            ? "bg-gradient-to-br from-primary to-oklch(0.45 0.11 275) text-primary-foreground shadow-glow"
            : "bg-surface-2 text-foreground",
        )}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white animate-pop">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-[60] w-[min(21rem,calc(100vw-2.5rem))] animate-scale-in overflow-hidden rounded-3xl border border-border bg-surface shadow-elevated">
          {/* Header gradient */}
          <div className="relative bg-gradient-to-br from-primary via-oklch(0.38 0.1 270) to-oklch(0.28 0.09 280) px-4 py-4 text-primary-foreground">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/15">
                <Bell className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-bold">Notifikasi</p>
                <p className="text-[11px] text-white/80">
                  {unread > 0 ? `${unread} belum dibaca` : "Semua sudah dibaca"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup notifikasi"
                className="grid h-8 w-8 place-items-center rounded-xl bg-white/15 text-white transition active:scale-90 hover:bg-white/25"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Filter cepat */}
            <div className="mt-3 flex gap-1.5 rounded-2xl bg-black/15 p-1">
              {(["semua", "belum"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={cn(
                    "flex-1 rounded-xl px-2 py-1.5 text-[11px] font-bold transition",
                    filter === f
                      ? "bg-white text-ink shadow-card"
                      : "text-white/80 hover:text-white",
                  )}
                >
                  {f === "semua" ? "Semua" : "Belum dibaca"}
                </button>
              ))}
            </div>
          </div>

          <ul className="max-h-72 divide-y divide-border/60 overflow-y-auto p-2">
            {items.length === 0 && (
              <li className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Inbox className="h-6 w-6" />
                </span>
                <p className="text-[12px] font-semibold text-ink">
                  Tidak ada notifikasi
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {filter === "belum"
                    ? "Semua notifikasi sudah dibaca."
                    : "Belum ada notifikasi baru."}
                </p>
              </li>
            )}
            {items.map((n) => (
              <li key={n.id} className="py-1">
                <NotificationInboxItem notification={n} compact />
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2 border-t border-border/60 bg-surface-2/60 px-3 py-3">
            <button
              type="button"
              disabled={unread === 0}
              onClick={() => markAllNotificationsRead()}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl px-3 py-2 text-[11px] font-bold transition active:scale-95",
                unread === 0
                  ? "bg-surface-2 text-muted-foreground"
                  : "bg-primary/10 text-primary",
              )}
            >
              <CheckCheck className="h-3.5 w-3.5" /> Tandai dibaca
            </button>
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-br from-primary to-oklch(0.45 0.11 275) px-3 py-2 text-[11px] font-bold text-white shadow-glow transition active:scale-95"
            >
              <Mail className="h-3.5 w-3.5" /> Lihat semua
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
