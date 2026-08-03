import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Bell, ClipboardList, User, PhoneCall } from "lucide-react";
import { cn } from "@/lib/utils";

const items: { to: string; label: string; icon: typeof Home; primary?: boolean }[] = [
  { to: "/dashboard", label: "Beranda", icon: Home },
  { to: "/attendance-today", label: "Presensi", icon: ClipboardList },
  { to: "/pickup/method", label: "Jemput", icon: PhoneCall, primary: true },
  { to: "/notifications", label: "Notif", icon: Bell },
  { to: "/profile", label: "Akun", icon: User },
];

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[480px] px-3 pb-3">
      <div className="flex items-center justify-between rounded-3xl border border-border/60 bg-surface/95 px-2 py-2 shadow-elevated backdrop-blur">
        {items.map((it) => {
          const active = pathname === it.to || (it.to !== "/dashboard" && pathname.startsWith(it.to));
          const Icon = it.icon;
          if (it.primary) {
            return (
              <Link
                key={it.to}
                to={it.to}
                className="grid h-14 w-14 -translate-y-4 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-glow transition active:scale-95"
              >
                <Icon className="h-6 w-6" />
              </Link>
            );
          }
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-semibold transition",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5 transition", active && "scale-110")} />
              <span>{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
