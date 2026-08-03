import { createFileRoute } from "@tanstack/react-router";
import { usePageReady } from "@/hooks/use-page-ready";
import { PageSkeleton } from "@/components/feedback/Skeletons";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { students } from "@/lib/dummy/data";
import { IconBadge, Chip } from "@/components/common/Section";
import { ClipboardCheck, ClipboardList } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/attendance-today")({
  head: () => ({
    meta: [
      { title: "Presensi Hari Ini — Panggil" },
      { name: "description", content: "Status presensi hadir dan pulang seluruh siswa Anda hari ini." },
      { property: "og:title", content: "Presensi Hari Ini" },
      { property: "og:description", content: "Warna indikator sederhana memudahkan pantauan." },
    ],
  }),
  component: Attendance,
});

function Attendance() {
  const ready = usePageReady();
  const [pick, setPick] = useState<string>("all");
  if (!ready) return <PageSkeleton />;
  const list = pick === "all" ? students : students.filter((s) => s.id === pick);
  return (
    <PhoneShell>
      <TopBar title="Presensi Hari Ini" back="/dashboard" subtitle="Diperbarui otomatis" />
      <div className="space-y-3 p-5">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {[{ id: "all", nickname: "Semua" }, ...students].map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setPick(o.id)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition active:scale-95",
                pick === o.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface text-foreground",
              )}
            >
              {o.nickname}
            </button>
          ))}
        </div>
        {list.map((s) => {
          const tone = s.dismissStatus === "sudah" ? "success" : s.attendanceStatus === "hadir" ? "warm" : "muted";
          return (
            <div key={s.id} className="rounded-3xl border border-border bg-surface p-4 shadow-card">
              <div className="flex items-center gap-3">
                <span
                  className="grid h-12 w-12 place-items-center rounded-2xl font-display text-lg font-bold text-white"
                  style={{ backgroundColor: s.avatarColor }}
                >
                  {s.nickname[0]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-bold text-ink">{s.name}</p>
                  <p className="text-xs text-muted-foreground">Kelas {s.className}</p>
                </div>
                {s.pendingApproval && <Chip tone="warning">Pending Approval</Chip>}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <StatusRow icon={<ClipboardCheck className="h-4 w-4" />} label="Hadir" value={s.attendedAt ?? "—"} tone="success" />
                <StatusRow
                  icon={<ClipboardList className="h-4 w-4" />}
                  label="Pulang"
                  value={s.dismissedAt ?? "Belum"}
                  tone={tone === "success" ? "success" : "muted"}
                />
              </div>
            </div>
          );
        })}
      </div>
      <BottomNav />
    </PhoneShell>
  );
}

function StatusRow({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "success" | "muted" | "warm";
}) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-surface-2 p-2.5">
      <IconBadge tone={tone}>{icon}</IconBadge>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="truncate text-xs font-semibold text-ink">{value}</p>
      </div>
    </div>
  );
}
