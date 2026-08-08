import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/layout/PlaceholderPage";
import { School, Clock } from "lucide-react";
import { schoolName } from "@/lib/dummy/data";
import { useStudents } from "@/lib/students";
import { isHoliday } from "@/lib/pickup/schedule";

export const Route = createFileRoute("/school")({
  head: () => ({
    meta: [
      { title: "Informasi Sekolah — Panggil" },
      { name: "description", content: "Jam pulang, agenda, dan pengumuman resmi sekolah." },
      { property: "og:title", content: "Informasi Sekolah" },
      { property: "og:description", content: "Pantau agenda dan pengumuman terbaru." },
    ],
  }),
  component: InformasiSekolah,
});

function InformasiSekolah() {
  const { students } = useStudents();
  const active = students.filter((s) => !s.pendingApproval);

  // Jam pulang hari ini mengikuti database (kelas siswa). Ambil nilai pertama yang tersedia
  // sebagai waktu representatif; jika variasinya beragam, tampilkan daftar per kelas.
  const holiday = isHoliday();
  const dismissalOptions = Array.from(
    new Set(active.map((s) => s.dismissalTime).filter(Boolean)),
  ).sort();

  return (
    <PlaceholderPage title="Informasi Sekolah" back="/dashboard" icon={<School className="h-6 w-6" />}>
      <div className="space-y-3">
        <div className="rounded-3xl bg-gradient-hero p-5 text-primary-foreground shadow-elevated">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">{schoolName}</p>
          <p className="mt-1 font-display text-xl font-bold">
            {holiday
              ? "Hari ini libur"
              : dismissalOptions.length > 0
                ? `Jam pulang ${dismissalOptions.join(" / ")}`
                : "Jam pulang —"}
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-surface p-4 shadow-card">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-primary">Jam pulang per kelas (hari ini)</p>
          {active.length === 0 ? (
            <p className="text-xs text-muted-foreground">Belum ada data siswa.</p>
          ) : holiday ? (
            <p className="text-xs text-muted-foreground">Hari ini libur — tidak ada jam kepulangan.</p>
          ) : (
            <ul className="space-y-2">
              {active.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ink">{s.name}</span>
                    <span className="block text-[11px] text-muted-foreground">
                      {s.className ? `Kelas ${s.className}` : "—"}
                    </span>
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
                    <Clock className="h-3 w-3" /> {s.dismissalTime ?? "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </PlaceholderPage>
  );
}
