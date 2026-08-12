import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { usePageReady } from "@/hooks/use-page-ready";
import { PageSkeleton } from "@/components/feedback/Skeletons";
import { useState } from "react";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { TopBar } from "@/components/layout/TopBar";
import { BigButton } from "@/components/common/BigButton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { MAX_PICKUP_TIME_WIB } from "@/lib/dummy/data";
import { useStudents } from "@/lib/students";
import { pickupBlockReason } from "@/lib/pickup/callDeadline";
import { UserRound, UsersRound, Bike, ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pickup/method")({
  head: () => ({
    meta: [
      { title: "Pilih Metode — Panggil" },
      { name: "description", content: "Pilih metode penjemputan: sendiri, orang lain, atau ojek online." },
      { property: "og:title", content: "Pilih Metode Penjemputan" },
      { property: "og:description", content: "Tiga pilihan sederhana untuk penjemputan." },
    ],
  }),
  component: MethodPage,
});

type Method = "self" | "other" | "ojek";

function MethodPage() {
  const ready = usePageReady();
  const [method, setMethod] = useState<Method | null>(null);
const nav = useNavigate();
const { students, isInitialLoading } = useStudents();
const active = students.filter((s) => !s.pendingApproval);
const needsSelect = active.length > 1;
  const block = pickupBlockReason();
  if (!ready || isInitialLoading) return <PageSkeleton withNav={false} />;

  // Jika pemanggilan terblokir (master off ATAU lewat jam tutup di hari sekolah), blokir alur penjemputan.
  if (block) {
    const isOff = block === "off";
    return (
      <PhoneShell>
        <TopBar title="Mulai Jemput" back="/dashboard" subtitle={isOff ? "Pemanggilan nonaktif" : "Pemanggilan ditutup"} />
        <div className="p-5">
          <EmptyState
            icon={<Clock className="h-7 w-7" />}
            title={isOff ? "Pemanggilan sedang nonaktif" : "Pemanggilan sudah ditutup"}
            body={
              isOff
                ? "Layanan pemanggilan penjemputan sedang dinonaktifkan oleh pihak sekolah untuk sementara waktu. Anda tidak dapat memulai penjemputan saat ini."
                : `Layanan pemanggilan penjemputan telah berakhir pada pukul ${MAX_PICKUP_TIME_WIB} WIB. Anda tidak dapat memulai penjemputan saat ini.`
            }
            action={
              <BigButton onClick={() => nav({ to: "/dashboard" })}>Kembali ke Beranda</BigButton>
            }
          />
        </div>
      </PhoneShell>
    );
  }

  const items: { key: Method; icon: React.ReactNode; title: string; body: string }[] = [
    { key: "self", icon: <UserRound className="h-6 w-6" />, title: "Dijemput sendiri", body: "Orang tua yang datang menjemput." },
    { key: "other", icon: <UsersRound className="h-6 w-6" />, title: "Dijemput orang lain", body: "Kakek, nenek, atau keluarga terpercaya." },
    { key: "ojek", icon: <Bike className="h-6 w-6" />, title: "Ojek Online", body: "Driver terverifikasi menjemput anak." },
  ];

  return (
    <PhoneShell>
      <TopBar title="Metode Penjemputan" back="/dashboard" subtitle="Pilih salah satu" />
      <div className="space-y-3 p-5">
        {items.map((it) => {
          const active = method === it.key;
          return (
            <button
              key={it.key}
              onClick={() => setMethod(it.key)}
              className={cn(
                "flex w-full items-center gap-4 rounded-3xl border p-4 text-left shadow-card transition active:scale-[0.99]",
                active ? "border-primary bg-primary/5" : "border-border bg-surface",
              )}
            >
              <span className={cn("grid h-12 w-12 place-items-center rounded-2xl", active ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary")}>
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
          disabled={!method}
          onClick={() => {
            if (!method) return;
            const dest = needsSelect ? "/pickup/select" : `/pickup/form/${method}`;
            nav({ to: dest, search: needsSelect ? { m: method } : undefined });
          }}
        >
          Lanjutkan
        </BigButton>
      </div>
    </PhoneShell>
  );
}
