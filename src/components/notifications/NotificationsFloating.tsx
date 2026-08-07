import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, CheckCheck, Inbox, Mail, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useNotifications,
  dismissNotification,
  markAllNotificationsRead,
  toggleNotificationRead,
} from "@/lib/state/notificationStore";
import { SwipeableNotificationItem } from "./SwipeableNotificationItem";

type Filter = "semua" | "belum";

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
                <SwipeableNotificationItem
                  notification={n}
                  compact
                  onDismiss={() => dismissNotification(n.id)}
                  onToggleRead={() => toggleNotificationRead(n.id)}
                />
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
