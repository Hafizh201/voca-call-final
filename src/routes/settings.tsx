import { createFileRoute } from "@tanstack/react-router";
import { usePageReady } from "@/hooks/use-page-ready";
import { PageSkeleton } from "@/components/feedback/Skeletons";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { useSettings, settingsStore } from "@/lib/state/stores";
import { Switch } from "@/components/ui/switch";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Pengaturan — Panggil" },
      { name: "description", content: "Preferensi notifikasi, mode tampilan, dan aksesibilitas." },
      { property: "og:title", content: "Pengaturan Panggil" },
      { property: "og:description", content: "Sesuaikan aplikasi dengan kebutuhan Anda." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const ready = usePageReady();
  const s = useSettings();
  if (!ready) return <PageSkeleton />;
  return (
    <PhoneShell>
      <TopBar title="Pengaturan" back="/profile" />
      <div className="space-y-3 p-5">
        <Row
          title="Mode Lansia"
          body="Perbesar tulisan & tombol"
          control={
            <Switch
              checked={s.elderlyMode}
              onCheckedChange={(v) => {
                settingsStore.set({ elderlyMode: v });
                if (typeof document !== "undefined") document.documentElement.dataset.elderly = String(v);
              }}
            />
          }
        />
        <Row
          title="Notifikasi"
          body="Pemberitahuan penjemputan & pengumuman"
          control={<Switch checked={s.notifications} onCheckedChange={(v) => settingsStore.set({ notifications: v })} />}
        />
        <Link to="/settings/accessibility" className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-card">
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-bold text-ink">Aksesibilitas</p>
            <p className="text-[11px] text-muted-foreground">Ukuran teks, kontras, motion</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>
      <BottomNav />
    </PhoneShell>
  );
}

function Row({ title, body, control }: { title: string; body: string; control: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4 shadow-card">
      <div>
        <p className="font-display text-sm font-bold text-ink">{title}</p>
        <p className="text-[11px] text-muted-foreground">{body}</p>
      </div>
      {control}
    </div>
  );
}
