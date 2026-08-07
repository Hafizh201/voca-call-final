import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, CheckCheck, Trash2, X, Inbox } from "lucide-react";
import { notifications as seedNotifications } from "@/lib/dummy/data";
import { cn } from "@/lib/utils";

type Notif = { id: string; title: string; body: string; time: string; read: boolean };

export function NotificationsFloating() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>(() => seedNotifications.map((n) => ({ ...n })));
  const ref = useRef<HTMLDivElement>(null);

  const unread = items.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
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
          open ? "bg-primary text-primary-foreground" : "bg-surface-2 text-foreground",
        )}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-[60] w-[min(20rem,calc(100vw-2.5rem))] animate-scale-in overflow-hidden rounded-3xl border border-border bg-surface shadow-card">
          <div className="flex items-center gap-2 border-b border-border/60 bg-surface-2/70 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-bold text-ink">Notifikasi</p>
              <p className="text-[11px] text-muted-foreground">
                {unread > 0 ? `${unread} belum dibaca` : "Semua sudah dibaca"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Tutup notifikasi"
              className="grid h-7 w-7 place-items-center rounded-xl bg-surface text-muted-foreground active:scale-95"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <ul className="max-h-64 divide-y divide-border/60 overflow-y-auto">
            {items.length === 0 && (
              <li className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <Inbox className="h-6 w-6 text-muted-foreground" />
                <p className="text-[11px] text-muted-foreground">Belum ada notifikasi.</p>
              </li>
            )}
            {items.map((n) => (
              <li
                key={n.id}
                className={cn("flex items-start gap-2 px-4 py-3 transition", !n.read && "bg-primary/5")}
              >
                <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.read ? "bg-border" : "bg-primary")} />
                <button
                  type="button"
                  onClick={() =>
                    setItems((p) => p.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
                  }
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate font-display text-[13px] font-bold text-ink">{n.title}</p>
                  <p className="line-clamp-2 text-[11px] text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{n.time}</p>
                </button>
                <button
                  type="button"
                  aria-label="Hapus notifikasi"
                  onClick={() => setItems((p) => p.filter((x) => x.id !== n.id))}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-surface-2 text-muted-foreground transition active:scale-95"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2 border-t border-border/60 px-3 py-3">
            <button
              type="button"
              disabled={unread === 0}
              onClick={() => setItems((p) => p.map((x) => ({ ...x, read: true })))}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl px-3 py-2 text-[11px] font-bold transition active:scale-95",
                unread === 0 ? "bg-surface-2 text-muted-foreground" : "bg-primary/10 text-primary",
              )}
            >
              <CheckCheck className="h-3.5 w-3.5" /> Tandai dibaca
            </button>
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="inline-flex flex-1 items-center justify-center rounded-2xl bg-primary px-3 py-2 text-[11px] font-bold text-primary-foreground transition active:scale-95"
            >
              Lihat semua
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
