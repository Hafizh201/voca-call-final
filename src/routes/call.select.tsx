import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { usePageReady } from "@/hooks/use-page-ready";
import { PageSkeleton } from "@/components/feedback/Skeletons";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { TopBar } from "@/components/layout/TopBar";
import { BigButton } from "@/components/common/BigButton";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/feedback/EmptyState";
import { useStudents } from "@/lib/students";
import { Check, Clock, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";

const searchSchema = z.object({ t: z.enum(["ditunggu", "titipan"]).default("ditunggu") });

export const Route = createFileRoute("/call/select")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Pilih Siswa Dipanggil — Panggil" },
      { name: "description", content: "Pilih siswa yang akan dipanggil untuk titipan atau karena ditunggu." },
      { property: "og:title", content: "Pilih Siswa Dipanggil" },
      { property: "og:description", content: "Bisa memilih satu atau beberapa siswa sekaligus." },
    ],
  }),
  component: CallSelectPage,
});

function CallSelectPage() {
  const ready = usePageReady();
  const { t } = Route.useSearch();
  const { students, isInitialLoading } = useStudents();
  const active = students.filter((s) => s && s.name?.trim() && !s.pendingApproval);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitAsk, setSubmitAsk] = useState(false);
  const nav = useNavigate();
  if (!ready || isInitialLoading) return <PageSkeleton withNav={false} />;

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const isTitipan = t === "titipan";

  return (
    <PhoneShell>
      <TopBar
        title="Pilih Siswa"
        back="/call/method"
        subtitle={isTitipan ? "Untuk ambil titipan" : "Untuk panggilan ditunggu"}
      />
      <div className="space-y-3 p-5 pb-32">
        {active.length === 0 ? (
          <EmptyState
            icon={<UsersRound className="h-6 w-6" />}
            title="Belum ada data siswa"
            body="Tidak ada siswa yang dapat dipanggil saat ini."
          />
        ) : (
          active.map((s) => {
            const checked = selected.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() => toggle(s.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-3xl border p-4 text-left shadow-card transition active:scale-[0.99]",
                  checked ? "border-primary bg-primary/5" : "border-border bg-surface",
                )}
              >
                <span
                  className="grid h-12 w-12 place-items-center rounded-2xl font-display text-xl font-bold text-white"
                  style={{ backgroundColor: s.avatarColor }}
                >
                  {s.nickname[0]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base font-bold text-ink">{s.name}</p>
                  {s.className || s.nis ? (
                    <p className="text-xs text-muted-foreground">
                      {s.className ? `Kelas ${s.className}` : ""}
                      {s.className && s.nis ? " · " : ""}
                      {s.nis ? `NIS ${s.nis}` : ""}
                    </p>
                  ) : null}
                  <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-bold text-ink">
                    <Clock className="h-3 w-3 text-primary" /> Jam Kepulangan : {s.dismissalTime ?? "—"}
                  </span>
                </div>
                <span
                  className={cn(
                    "grid h-6 w-6 place-items-center rounded-md border-2",
                    checked ? "border-primary bg-primary text-white" : "border-border",
                  )}
                >
                  {checked && <Check className="h-4 w-4" />}
                </span>
              </button>
            );
          })
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-[480px] border-t border-border bg-background/95 px-5 pb-6 pt-4 backdrop-blur">
        <BigButton disabled={selected.length === 0} onClick={() => setSubmitAsk(true)}>
          Pilih {selected.length} siswa
        </BigButton>
      </div>

      <ConfirmDialog
        open={submitAsk}
        title={isTitipan ? "Konfirmasi ambil titipan" : "Konfirmasi panggilan ditunggu"}
        description={
          <>
            Anda akan memanggil{" "}
            <span className="font-semibold text-ink">{selected.length} siswa</span>. Pastikan seluruh nama sudah benar
            sebelum melanjutkan.
          </>
        }
        confirmLabel="Ya, Lanjutkan"
        cancelLabel="Periksa Lagi"
        onCancel={() => setSubmitAsk(false)}
        onConfirm={() => {
          setSubmitAsk(false);
          nav({ to: `/call/form/${t}`, search: { s: selected.join(",") } });
        }}
      />
    </PhoneShell>
  );
}
