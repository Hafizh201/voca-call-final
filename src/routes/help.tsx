import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/layout/PlaceholderPage";
import { LifeBuoy, Phone } from "lucide-react";
import { contacts } from "@/lib/dummy/data";
import { IconBadge } from "@/components/common/Section";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Bantuan — Panggil" },
      { name: "description", content: "Panduan, pertanyaan umum, dan kontak sekolah." },
      { property: "og:title", content: "Pusat Bantuan" },
      { property: "og:description", content: "FAQ dan kontak penting." },
    ],
  }),
  component: () => (
    <PlaceholderPage title="Bantuan" back="/profile" icon={<LifeBuoy className="h-6 w-6" />}>
      <div className="space-y-3">
        {contacts.map((c) => (
          <a key={c.id} href={`tel:${c.phone}`} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-card">
            <IconBadge tone="primary"><Phone className="h-5 w-5" /></IconBadge>
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-bold text-ink">{c.role} — {c.name}</p>
              <p className="text-xs text-muted-foreground">{c.phone}</p>
            </div>
          </a>
        ))}
      </div>
    </PlaceholderPage>
  ),
});
