import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { usePageReady } from "@/hooks/use-page-ready";
import { PageSkeleton } from "@/components/feedback/Skeletons";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { BigButton } from "@/components/common/BigButton";
import { CheckCircle2 } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({ t: z.enum(["ditunggu", "titipan"]).default("ditunggu") });

export const Route = createFileRoute("/call/complete")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Panggilan Selesai — Panggil" },
      { name: "description", content: "Panggilan siswa berhasil diselesaikan." },
      { property: "og:title", content: "Panggilan Selesai" },
      { property: "og:description", content: "Terima kasih telah menggunakan Panggil." },
    ],
  }),
  component: CallCompletePage,
});

function CallCompletePage() {
  const ready = usePageReady();
  const { t } = Route.useSearch();
  const nav = useNavigate();
  if (!ready) return <PageSkeleton withNav={false} />;
  const isTitipan = t === "titipan";
  return (
    <PhoneShell padded={false}>
      <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center">
        <div className="grid h-24 w-24 place-items-center rounded-3xl bg-success/15 text-success-foreground animate-scale-in">
          <CheckCircle2 className="h-12 w-12" />
        </div>
        <h1 className="mt-6 font-display text-2xl font-bold text-ink">
          {isTitipan ? "Titipan sudah diambil" : "Panggilan selesai"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isTitipan
            ? "Terima kasih. Titipan telah diterima oleh Ananda."
            : "Terima kasih. Ananda sudah menemui yang menunggu."}
        </p>
        <div className="mt-10 w-full space-y-2">
          <BigButton onClick={() => nav({ to: "/dashboard" })}>Kembali ke Beranda</BigButton>
          <BigButton variant="secondary" onClick={() => nav({ to: "/history" })}>Lihat Riwayat</BigButton>
        </div>
      </div>
    </PhoneShell>
  );
}
