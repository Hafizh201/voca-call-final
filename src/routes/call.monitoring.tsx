import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { usePageReady } from "@/hooks/use-page-ready";
import { PageSkeleton } from "@/components/feedback/Skeletons";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { TopBar } from "@/components/layout/TopBar";
import { BigButton } from "@/components/common/BigButton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { useStudents } from "@/lib/students";
import { useActiveCall, completeCall } from "@/lib/call/stores";
import { PackageOpen, UserRoundCheck, Megaphone } from "lucide-react";

export const Route = createFileRoute("/call/monitoring")({
  head: () => ({
    meta: [
      { title: "Pantau Panggilan — Panggil" },
      { name: "description", content: "Pantau status panggilan titipan atau panggilan ditunggu." },
      { property: "og:title", content: "Pantau Panggilan" },
      { property: "og:description", content: "Status panggilan Ananda secara langsung." },
    ],
  }),
  component: CallMonitoringPage,
});

function CallMonitoringPage() {
  const ready = usePageReady();
  const nav = useNavigate();
  const { current } = useActiveCall();
  const { students } = useStudents();
  if (!ready) return <PageSkeleton withNav={false} />;

  if (!current) {
    return (
      <PhoneShell>
        <TopBar title="Pantau Panggilan" back="/dashboard" />
        <div className="p-5">
          <EmptyState
            icon={<Megaphone className="h-6 w-6" />}
            title="Tidak ada panggilan aktif"
            body="Belum ada panggilan titipan atau ditunggu yang sedang berjalan."
            action={<BigButton onClick={() => nav({ to: "/call/method" })}>Buat Panggilan</BigButton>}
          />
        </div>
      </PhoneShell>
    );
  }

  const isTitipan = current.type === "titipan";
  const names = current.studentIds
    .map((id) => students.find((s) => s.id === id)?.name)
    .filter(Boolean)
    .join(", ");
  const p = current.payload;

  return (
    <PhoneShell>
      <TopBar
        title={isTitipan ? "Pantau Titipan" : "Pantau Panggilan"}
        back="/dashboard"
        subtitle={isTitipan ? "Ada titipan untuk Ananda" : "Ananda sedang ditunggu"}
      />
      <div className="space-y-4 p-5 pb-32">
        <div className="rounded-3xl bg-gradient-hero p-5 text-primary-foreground shadow-elevated">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15">
            {isTitipan ? <PackageOpen className="h-6 w-6" /> : <UserRoundCheck className="h-6 w-6" />}
          </span>
          <p className="mt-3 font-display text-xl font-bold">
            {isTitipan
              ? current.taken
                ? "Titipan sudah diambil"
                : "Titipan belum diambil"
              : current.done
                ? "Panggilan selesai"
                : "Sedang dipanggil"}
          </p>
          <p className="mt-1 text-xs text-white/80">{names || "—"}</p>
        </div>

        <div className="space-y-2 rounded-3xl border border-border bg-surface p-4 text-xs shadow-card">
          <Row label="Siswa" value={names || "—"} />
          {p.type === "titipan" ? (
            <>
              <Row label="Penitip" value={p.namaPenitip} />
              <Row label="Jenis titipan" value={p.jenisTitipan} />
            </>
          ) : (
            <>
              <Row label="Ditunggu oleh" value={p.ditungguOleh} />
              <Row label="Posisi tunggu" value={p.posisiTunggu} />
            </>
          )}
          {p.shortMessg ? <Row label="Pesan singkat" value={p.shortMessg} /> : null}
          <Row label="Metode" value={p.method} />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-[480px] space-y-2 border-t border-border bg-background/95 px-5 pb-6 pt-4 backdrop-blur">
        <BigButton
          onClick={() => {
            completeCall(current.id);
            nav({ to: "/call/complete", search: { t: current.type } });
          }}
        >
          {isTitipan ? "Tandai Sudah Diambil" : "Tandai Selesai"}
        </BigButton>
        <BigButton variant="secondary" onClick={() => nav({ to: "/dashboard" })}>
          Kembali ke Beranda
        </BigButton>
      </div>
    </PhoneShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[60%] text-right font-semibold text-ink">{value}</span>
    </div>
  );
}
