import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { usePageReady } from "@/hooks/use-page-ready";
import { PageSkeleton } from "@/components/feedback/Skeletons";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { useSession, useSettings, sessionStore, settingsStore } from "@/lib/state/stores";
import { BigButton } from "@/components/common/BigButton";
import { Switch } from "@/components/ui/switch";
import { LogOut, Users, ShieldCheck, Settings, LifeBuoy } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { IconBadge } from "@/components/common/Section";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Akun — Panggil" },
      { name: "description", content: "Kelola akun wali murid, PIN, dan preferensi." },
      { property: "og:title", content: "Akun Panggil" },
      { property: "og:description", content: "Preferensi & data akun." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const ready = usePageReady();
  const session = useSession();
  const settings = useSettings();
  const nav = useNavigate();
  if (!ready) return <PageSkeleton />;

  const items = [
    { to: "/children", icon: <Users className="h-5 w-5" />, title: "Data Anak", body: "Kelola siswa Anda" },
    { to: "/trusted-pickup", icon: <ShieldCheck className="h-5 w-5" />, title: "Trusted Pickup", body: "Daftar penjemput terpercaya" },
    { to: "/settings", icon: <Settings className="h-5 w-5" />, title: "Pengaturan", body: "Notifikasi, aksesibilitas, tampilan" },
    { to: "/help", icon: <LifeBuoy className="h-5 w-5" />, title: "Bantuan", body: "FAQ & kontak sekolah" },
  ];

  return (
    <PhoneShell>
      <TopBar title="Akun" back="/dashboard" />
      <div className="p-5">
        <div className="rounded-3xl bg-gradient-hero p-5 text-primary-foreground shadow-elevated">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">Wali murid</p>
<p className="mt-1 font-display text-xl font-bold">{session.namaWalmur ?? session.username ?? "Wali"}</p>
          <p className="text-xs text-white/70">SMPIT Abu Bakar Fullday School</p>
        </div>

        <div className="mt-6 flex items-center justify-between rounded-2xl border border-border bg-surface p-4 shadow-card">
          <div>
            <p className="font-display text-sm font-bold text-ink">Mode Lansia</p>
            <p className="text-[11px] text-muted-foreground">Perbesar tulisan dan tombol.</p>
          </div>
          <Switch
            checked={settings.elderlyMode}
            onCheckedChange={(v) => {
              settingsStore.set({ elderlyMode: v });
              if (typeof document !== "undefined") document.documentElement.dataset.elderly = String(v);
            }}
          />
        </div>

        <div className="mt-4 space-y-2">
          {items.map((it) => (
            <Link key={it.to} to={it.to} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-card active:scale-[0.99]">
              <IconBadge>{it.icon}</IconBadge>
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-bold text-ink">{it.title}</p>
                <p className="text-[11px] text-muted-foreground">{it.body}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8">
          <BigButton
            variant="danger"
            leading={<LogOut className="h-5 w-5" />}
            onClick={() => {
sessionStore.set({ signedIn: false, username: null, namaWalmur: null });
              nav({ to: "/login" });
            }}
          >
            Keluar
          </BigButton>
        </div>
      </div>
      <BottomNav />
    </PhoneShell>
  );
}
