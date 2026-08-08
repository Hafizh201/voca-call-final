import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { usePageReady } from "@/hooks/use-page-ready";
import { FormSkeleton } from "@/components/feedback/Skeletons";
import { useState } from "react";
import { z } from "zod";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { TopBar } from "@/components/layout/TopBar";
import { BigButton } from "@/components/common/BigButton";
import { getDraft, resetDraft } from "@/lib/pickup/draft";
import { useStudents } from "@/lib/students";
import { submitPickup } from "@/lib/pickup/simulator";
import { formatPlate } from "@/lib/format/utils";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const searchSchema = z.object({ s: z.string(), f: z.string().optional() });

export const Route = createFileRoute("/pickup/preview")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Ringkasan — Panggil" },
      { name: "description", content: "Periksa kembali data penjemputan sebelum mengirim." },
      { property: "og:title", content: "Ringkasan Penjemputan" },
      { property: "og:description", content: "Konfirmasi data Anda." },
    ],
  }),
  component: PreviewPage,
});

function PreviewPage() {
  const ready = usePageReady();
  const { s } = Route.useSearch();
  const [checks, setChecks] = useState({ data: false, kontak: false });
  const nav = useNavigate();
  const draft = getDraft();
  const { students } = useStudents();
  const studentIds = s.split(",");
  const chosen = studentIds.map((id: string) => students.find((x) => x.id === id)!).filter(Boolean);
  const allChecked = checks.data && checks.kontak;
  if (!ready) return <FormSkeleton />;

  const estimateLabel =
    draft.estimate === "sudah"
      ? "Sudah sampai di sekolah"
      : draft.estimate === "qr"
        ? "Sistem QR (dipindai saat tiba)"
        : `± ${draft.estimate} menit lagi`;

  const rows: [string, string][] = [
    ["Siswa", chosen.map((c: { name: string }) => c.name).join(", ")],
    ["Metode", labelOf(draft.method)],
    ["Kedatangan", estimateLabel],
    ...(draft.method === "self" ? [["Lokasi menunggu", draft.waitLocation] as [string, string]] : []),
    ...(draft.method === "other"
      ? [
          ["Penjemput", draft.pickerName] as [string, string],
        ]
      : []),
    ...(draft.method === "ojek"
      ? [
          ["Driver", draft.driverName] as [string, string],
          ["Platform", draft.platform] as [string, string],
          ["Plat", formatPlate(draft.plate)] as [string, string],
        ]
      : []),
    ["Catatan", draft.note || "—"],
    ["Catatan penting", draft.noteExtras.length > 0 ? draft.noteExtras.join(" ") : "—"],
  ];

  const submit = () => {
    submitPickup({
      studentIds,
      method: draft.method,
      note: draft.note,
      noteExtras: draft.noteExtras,
      estimate: draft.estimate,
      waitLocation: draft.waitLocation,
      pickerName: draft.pickerName,
      driverName: draft.driverName,
      platform: draft.platform,
      plate: formatPlate(draft.plate),
    });
    resetDraft();
    nav({ to: "/monitoring" });
  };

  return (
    <PhoneShell>
      <TopBar title="Ringkasan Permintaan" back="/pickup/method" subtitle="Periksa sebelum mengirim" />
      <div className="space-y-4 p-5">
        <div className="rounded-3xl border border-border bg-surface p-4 shadow-card">
          <dl className="divide-y divide-border">
            {rows.map(([k, v]) => (
              <div key={k} className="flex items-start justify-between gap-3 py-2.5">
                <dt className="text-xs font-semibold text-muted-foreground">{k}</dt>
                <dd className="max-w-[60%] text-right text-sm font-medium text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="space-y-2">
          <CheckRow
            label="Saya sudah memeriksa seluruh data di atas."
            checked={checks.data}
            onToggle={() => setChecks((p) => ({ ...p, data: !p.data }))}
          />
          <CheckRow
            label="Saya bertanggung jawab atas informasi penjemput."
            checked={checks.kontak}
            onToggle={() => setChecks((p) => ({ ...p, kontak: !p.kontak }))}
          />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-[480px] border-t border-border bg-background/95 px-5 pb-6 pt-4 backdrop-blur">
        <BigButton disabled={!allChecked} onClick={submit}>
          Kirim Permintaan
        </BigButton>
      </div>
    </PhoneShell>
  );
}

function CheckRow({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl border p-3 text-left shadow-card transition",
        checked ? "border-primary bg-primary/5" : "border-border bg-surface",
      )}
    >
      <span className={cn("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2", checked ? "border-primary bg-primary text-white" : "border-border")}>
        {checked && <Check className="h-3 w-3" />}
      </span>
      <span className="text-sm text-ink">{label}</span>
    </button>
  );
}

function labelOf(m: "self" | "other" | "ojek") {
  return m === "self" ? "Dijemput Sendiri" : m === "other" ? "Dijemput Orang Lain" : "Ojek Online";
}
