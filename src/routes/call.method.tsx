import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { usePageReady } from "@/hooks/use-page-ready";
import { PageSkeleton } from "@/components/feedback/Skeletons";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { TopBar } from "@/components/layout/TopBar";
import { BigButton } from "@/components/common/BigButton";
import { UserRoundCheck, PackageOpen, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/call/method")({
  head: () => ({
    meta: [
      { title: "Pilih Jenis Panggilan — Panggil" },
      {
        name: "description",
        content: "Pilih jenis panggilan: siswa ditunggu seseorang atau mengambil titipan.",
      },
      { property: "og:title", content: "Pilih Jenis Panggilan" },
      { property: "og:description", content: "Dua pilihan sederhana: ditunggu atau ambil titipan." },
    ],
  }),
  component: CallMethodPage,
});

type CallKind = "ditunggu" | "titipan";

function CallMethodPage() {
  const ready = usePageReady();
  const [kind, setKind] = useState<CallKind | null>(null);
  const nav = useNavigate();

  if (!ready) return <PageSkeleton withNav={false} />;

  const items: { key: CallKind; icon: React.ReactNode; title: string; body: string }[] = [
    {
      key: "ditunggu",
      icon: <UserRoundCheck className="h-6 w-6" />,
      title: "Panggil Ditunggu",
      body: "Ada seseorang yang menunggu Ananda di suatu tempat.",
    },
    {
      key: "titipan",
      icon: <PackageOpen className="h-6 w-6" />,
      title: "Ambil Titipan",
      body: "Ada titipan barang yang perlu diambil Ananda.",
    },
  ];

  return (
    <PhoneShell>
      <TopBar title="Jenis Panggilan" back="/dashboard" subtitle="Pilih salah satu" />
      <div className="space-y-3 p-5">
        {items.map((it) => {
          const active = kind === it.key;
          return (
            <button
              key={it.key}
              onClick={() => setKind(it.key)}
              className={cn(
                "flex w-full items-center gap-4 rounded-3xl border p-4 text-left shadow-card transition active:scale-[0.99]",
                active ? "border-primary bg-primary/5" : "border-border bg-surface",
              )}
            >
              <span
                className={cn(
                  "grid h-12 w-12 place-items-center rounded-2xl",
                  active ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
                )}
              >
                {it.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-base font-bold text-ink">{it.title}</p>
                <p className="text-xs text-muted-foreground">{it.body}</p>
              </div>
              <ChevronRight className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
            </button>
          );
        })}
      </div>
      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-[480px] border-t border-border bg-background/95 px-5 pb-6 pt-4 backdrop-blur">
        <BigButton
          disabled={!kind}
          onClick={() => {
            if (!kind) return;
            nav({ to: "/call/select", search: { t: kind } });
          }}
        >
          Lanjutkan
        </BigButton>
      </div>
    </PhoneShell>
  );
}
