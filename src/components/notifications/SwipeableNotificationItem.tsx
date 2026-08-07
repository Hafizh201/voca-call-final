import { useRef, useState } from "react";
import { Bell, Check, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/lib/state/notificationStore";

const SWIPE_THRESHOLD = 72;

export function NotificationIcon({ read }: { read: boolean }) {
  return (
    <span
      className={cn(
        "grid h-10 w-10 shrink-0 place-items-center rounded-2xl transition",
        read
          ? "bg-surface-2 text-muted-foreground"
          : "bg-gradient-to-br from-primary to-oklch(0.45 0.11 275) text-white shadow-glow",
      )}
    >
      <Bell className="h-4 w-4" />
    </span>
  );
}

export function SwipeableNotificationItem({
  notification,
  onOpen,
  onDismiss,
  onToggleRead,
  compact,
}: {
  notification: AppNotification;
  onOpen?: () => void;
  onDismiss: () => void;
  onToggleRead: () => void;
  compact?: boolean;
}) {
  const startX = useRef<number | null>(null);
  const [offset, setOffset] = useState(0);
  const [gone, setGone] = useState(false);

  const reset = () => setOffset(0);

  const commitDismiss = () => {
    setGone(true);
    window.setTimeout(onDismiss, 200);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    startX.current = e.clientX;
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    if (dx < 0) setOffset(Math.max(dx, -SWIPE_THRESHOLD - 24));
  };

  const onPointerUp = () => {
    if (startX.current === null) return;
    startX.current = null;
    if (offset <= -SWIPE_THRESHOLD) {
      commitDismiss();
    } else {
      reset();
    }
  };

  return (
    <div className="group relative overflow-hidden">
      {/* Latar belakang aksi di belakang item (terlihat saat di-swipe). */}
      <div
        className={cn(
          "absolute inset-y-0 right-0 flex w-20 items-center justify-center transition-opacity",
          offset < 0 ? "opacity-100" : "opacity-0",
        )}
      >
        <span className="grid h-10 w-10 place-items-center rounded-full bg-destructive text-white">
          <Trash2 className="h-4 w-4" />
        </span>
      </div>

      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onTouchStart={(e) => (startX.current = e.touches[0].clientX)}
        onTouchMove={(e) => {
          const dx = e.touches[0].clientX - (startX.current ?? 0);
          if (dx < 0) setOffset(Math.max(dx, -SWIPE_THRESHOLD - 24));
        }}
        onTouchEnd={onPointerUp}
        style={{ transform: `translateX(${gone ? -150 : offset}px)` }}
        className={cn(
          "relative flex touch-pan-y items-start gap-3 transition-[transform,opacity] duration-200 ease-out",
          gone && "opacity-0",
        )}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            onToggleRead();
            onOpen?.();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              onToggleRead();
              onOpen?.();
            }
          }}
          className={cn(
            "flex min-w-0 flex-1 cursor-pointer items-start gap-3 rounded-2xl border p-3.5 text-left shadow-card transition active:scale-[0.99]",
            notification.read
              ? "border-border/60 bg-surface/70"
              : "border-primary/20 bg-gradient-to-br from-primary/10 via-surface to-surface shadow-glow",
          )}
        >
          {compact ? null : <NotificationIcon read={notification.read} />}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p
                className={cn(
                  "truncate font-display text-[13px]",
                  notification.read
                    ? "font-semibold text-muted-foreground"
                    : "font-bold text-ink",
                )}
              >
                {notification.title}
              </p>
              {notification.read ? (
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-success/15 text-success">
                  <Check className="h-3 w-3" />
                </span>
              ) : (
                <span className="h-2 w-2 shrink-0 rounded-full bg-primary shadow-glow" />
              )}
            </div>
            <p
              className={cn(
                "mt-0.5 text-[11px]",
                notification.read
                  ? "text-muted-foreground/80"
                  : "text-muted-foreground",
              )}
            >
              {notification.body}
            </p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {notification.time} · geser untuk hapus
            </p>
          </div>
        </div>

        {/* Tombol close/dismiss per item. */}
        <button
          type="button"
          aria-label="Tutup notifikasi"
          onClick={commitDismiss}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-surface-2 text-muted-foreground transition hover:text-destructive active:scale-90"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
