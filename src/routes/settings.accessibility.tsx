import { createFileRoute } from "@tanstack/react-router";
import { usePageReady } from "@/hooks/use-page-ready";
import { PageSkeleton } from "@/components/feedback/Skeletons";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Switch } from "@/components/ui/switch";
import { useSettings, settingsStore, type TextScale } from "@/lib/state/stores";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/settings/accessibility")({
  head: () => ({
    meta: [
      { title: "Aksesibilitas — Panggil" },
      { name: "description", content: "Sesuaikan ukuran teks, kontras, dan animasi." },
      { property: "og:title", content: "Aksesibilitas" },
      { property: "og:description", content: "Nyaman untuk semua usia." },
    ],
  }),
  component: AccessibilityPage,
});

const SCALES: { value: TextScale; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "besar", label: "Besar" },
  { value: "sangat-besar", label: "Sangat Besar" },
];

function AccessibilityPage() {
  const ready = usePageReady();
  const s = useSettings();

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.dataset.textScale = s.textScale;
    root.dataset.contrast = String(s.highContrast);
    root.dataset.reduceMotion = String(s.reduceMotion);
  }, [s.textScale, s.highContrast, s.reduceMotion]);

  if (!ready) return <PageSkeleton />;

  return (
    <PhoneShell>
      <TopBar title="Aksesibilitas" back="/settings" subtitle="Berlaku langsung" />
      <div className="space-y-3 p-5">
        <section className="rounded-3xl border border-border bg-surface p-4 shadow-card">
          <p className="font-display text-sm font-bold text-ink">Ukuran teks</p>
          <p className="text-[11px] text-muted-foreground">Perbesar tulisan di seluruh aplikasi</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SCALES.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => settingsStore.set({ textScale: o.value })}
                className={cn(
                  "rounded-2xl border px-3 py-2 text-xs font-semibold transition active:scale-95",
                  s.textScale === o.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface text-foreground",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </section>

        <Row
          title="Kontras tinggi"
          body="Pertegas garis dan teks pendukung"
          control={
            <Switch
              checked={s.highContrast}
              onCheckedChange={(v) => settingsStore.set({ highContrast: v })}
            />
          }
        />
        <Row
          title="Kurangi animasi"
          body="Matikan transisi dan gerakan"
          control={
            <Switch
              checked={s.reduceMotion}
              onCheckedChange={(v) => settingsStore.set({ reduceMotion: v })}
            />
          }
        />
        <Row
          title="Mode Lansia"
          body="Perbesar tulisan & area tombol"
          control={
            <Switch
              checked={s.elderlyMode}
              onCheckedChange={(v) => {
                settingsStore.set({ elderlyMode: v });
                if (typeof document !== "undefined")
                  document.documentElement.dataset.elderly = String(v);
              }}
            />
          }
        />

        <button
          type="button"
          onClick={() => {
            settingsStore.set({ textScale: "normal", highContrast: false, reduceMotion: false, elderlyMode: false });
            if (typeof document !== "undefined") document.documentElement.dataset.elderly = "false";
            toast.success("Pengaturan aksesibilitas dikembalikan");
          }}
          className="w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm font-semibold text-foreground transition active:scale-95"
        >
          Kembalikan ke bawaan
        </button>
      </div>
      <BottomNav />
    </PhoneShell>
  );
}

function Row({ title, body, control }: { title: string; body: string; control: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 shadow-card">
      <div className="min-w-0">
        <p className="font-display text-sm font-bold text-ink">{title}</p>
        <p className="text-[11px] text-muted-foreground">{body}</p>
      </div>
      {control}
    </div>
  );
}
