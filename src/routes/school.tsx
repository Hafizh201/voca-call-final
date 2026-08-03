import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/layout/PlaceholderPage";
import { School } from "lucide-react";
import { announcements, dismissalTime, schoolName } from "@/lib/dummy/data";

export const Route = createFileRoute("/school")({
  head: () => ({
    meta: [
      { title: "Informasi Sekolah — Panggil" },
      { name: "description", content: "Jam pulang, agenda, dan pengumuman resmi sekolah." },
      { property: "og:title", content: "Informasi Sekolah" },
      { property: "og:description", content: "Pantau agenda dan pengumuman terbaru." },
    ],
  }),
  component: () => (
    <PlaceholderPage title="Informasi Sekolah" back="/dashboard" icon={<School className="h-6 w-6" />}>
      <div className="space-y-3">
        <div className="rounded-3xl bg-gradient-hero p-5 text-primary-foreground shadow-elevated">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">{schoolName}</p>
          <p className="mt-1 font-display text-xl font-bold">Jam pulang {dismissalTime}</p>
        </div>
        {announcements.map((a) => (
          <div key={a.id} className="rounded-3xl border border-border bg-surface p-4 shadow-card">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">{a.tag}</p>
            <h3 className="mt-1 font-display text-sm font-bold text-ink">{a.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{a.body}</p>
          </div>
        ))}
      </div>
    </PlaceholderPage>
  ),
});
