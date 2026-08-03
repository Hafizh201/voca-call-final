import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/layout/PlaceholderPage";
import { Users } from "lucide-react";
import { students } from "@/lib/dummy/data";
import { Chip } from "@/components/common/Section";

export const Route = createFileRoute("/children")({
  head: () => ({
    meta: [
      { title: "Data Anak — Panggil" },
      { name: "description", content: "Kelola data anak yang terdaftar di akun wali murid Anda." },
      { property: "og:title", content: "Data Anak" },
      { property: "og:description", content: "Tambah, edit, dan pantau status persetujuan." },
    ],
  }),
  component: () => (
    <PlaceholderPage title="Data Anak" back="/profile" icon={<Users className="h-6 w-6" />}>
      <div className="space-y-3">
        {students.map((s) => (
          <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-card">
            <span className="grid h-12 w-12 place-items-center rounded-2xl font-display text-lg font-bold text-white" style={{ backgroundColor: s.avatarColor }}>
              {s.nickname[0]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-bold text-ink">{s.name}</p>
              <p className="text-xs text-muted-foreground">Kelas {s.className} · NIS {s.nis}</p>
            </div>
            {s.pendingApproval && <Chip tone="warning">Pending Approval</Chip>}
          </div>
        ))}
      </div>
    </PlaceholderPage>
  ),
});
