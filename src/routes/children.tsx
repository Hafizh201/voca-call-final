import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/layout/PlaceholderPage";
import { Users } from "lucide-react";
import { useStudents } from "@/lib/students";
import { Chip } from "@/components/common/Section";
import { EmptyState } from "@/components/feedback/EmptyState";

export const Route = createFileRoute("/children")({
  head: () => ({
    meta: [
      { title: "Data Anak — Panggil" },
      { name: "description", content: "Kelola data anak yang terdaftar di akun wali murid Anda." },
      { property: "og:title", content: "Data Anak" },
      { property: "og:description", content: "Tambah, edit, dan pantau status persetujuan." },
    ],
  }),
  component: Children,
});

function Children() {
  // Data siswa dari database online (Supabase), hanya yang valid.
  const { students } = useStudents();
  const visible = (students ?? []).filter((s) => s && s.name?.trim());

  return (
    <PlaceholderPage title="Data Anak" back="/profile" icon={<Users className="h-6 w-6" />}>
      <div className="space-y-3">
        {visible.length === 0 ? (
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="Belum ada data siswa"
            body="Data anak yang terdaftar belum tersedia."
          />
        ) : (
          visible.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-card">
              <span className="grid h-12 w-12 place-items-center rounded-2xl font-display text-lg font-bold text-white" style={{ backgroundColor: s.avatarColor }}>
                {s.nickname ? s.nickname[0] : s.name[0]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-bold text-ink">{s.name}</p>
                <p className="text-xs text-muted-foreground">
                  {s.className ? `Kelas ${s.className}` : s.nis ? `NIS ${s.nis}` : ""}
                </p>
              </div>
              {s.pendingApproval && <Chip tone="warning">Pending Approval</Chip>}
            </div>
          ))
        )}
      </div>
    </PlaceholderPage>
  );
}
