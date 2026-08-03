import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { usePageReady } from "@/hooks/use-page-ready";
import { PageSkeleton } from "@/components/feedback/Skeletons";
import { useState } from "react";
import { z } from "zod";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { TopBar } from "@/components/layout/TopBar";
import { BigButton } from "@/components/common/BigButton";
import { BigTeman } from "@/components/common/teman";
import { students, type Friend, dismissalFor } from "@/lib/dummy/data";
import { FriendPicker } from "@/components/pickup/FriendPicker";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

import { Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const searchSchema = z.object({ m: z.enum(["self", "other", "ojek"]).default("self") });

export const Route = createFileRoute("/pickup/select")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Pilih Siswa — Panggil" },
      { name: "description", content: "Pilih siswa yang akan dijemput." },
      { property: "og:title", content: "Pilih Siswa" },
      { property: "og:description", content: "Satu, beberapa, atau seluruh anak sekaligus." },
    ],
  }),
  component: SelectStudent,
});

function SelectStudent() {
  const ready = usePageReady();
  const { m } = Route.useSearch();
  const active = students.filter((s) => !s.pendingApproval);
  const [selected, setSelected] = useState<string[]>([active[0].id]);
  const [friendOpen, setFriendOpen] = useState(false);
  const [friendList, setFriendList] = useState<Friend[]>([]);
  const [closeAsk, setCloseAsk] = useState(false);
  const [submitAsk, setSubmitAsk] = useState(false);
  const nav = useNavigate();
  if (!ready) return <PageSkeleton withNav={false} />;

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleToggleFriend = () => {
    if (friendOpen && friendList.length > 0) {
      setCloseAsk(true);
      return;
    }
    setFriendOpen((v) => !v);
  };

  const allowFriends = m !== "ojek";

  const goNext = () =>
    nav({
      to: `/pickup/form/${m}`,
      search: {
        s: selected.join(","),
        ...(allowFriends && friendList.length > 0 ? { f: friendList.map((x) => x.id).join(",") } : {}),
      },
    });




  return (
    <PhoneShell>
      <TopBar title="Pilih Siswa" back="/pickup/method" subtitle="Bisa lebih dari satu" />
      <div className="space-y-3 p-5">
        {active.map((s) => {
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
                <p className="text-xs text-muted-foreground">Kelas {s.className} · NIS {s.nis}</p>
                <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-bold text-ink">
                  <Clock className="h-3 w-3 text-primary" /> Jam Kepulangan : {dismissalFor(s.className)}
                </span>
              </div>
              <span className={cn("grid h-6 w-6 place-items-center rounded-md border-2", checked ? "border-primary bg-primary text-white" : "border-border")}>
                {checked && <Check className="h-4 w-4" />}
              </span>
            </button>
          );
        })}
        {allowFriends && (
          <>
            <FriendPicker
              open={friendOpen}
              selected={friendList}
              onAdd={(f) => setFriendList((prev) => (prev.some((x) => x.id === f.id) ? prev : [...prev, f]))}
              onRemove={(id) => setFriendList((prev) => prev.filter((x) => x.id !== id))}
            />
            <BigTeman onClick={handleToggleFriend}>
              {friendOpen ? "Tutup Tambah Teman" : "+ Teman ( Dijemput Bersama )"}
            </BigTeman>
          </>
        )}

      </div>
      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-[480px] border-t border-border bg-background/95 px-5 pb-6 pt-4 backdrop-blur">
        <BigButton disabled={selected.length === 0} onClick={() => setSubmitAsk(true)}>
          Pilih {selected.length} siswa
        </BigButton>
      </div>

      <ConfirmDialog
        open={closeAsk}
        title="Buang daftar teman?"
        description={`Anda menambahkan ${friendList.length} teman untuk dijemput bersama. Jika dibuang, seluruh nama pada daftar akan dihapus.`}
        confirmLabel="Buang Daftar"
        cancelLabel="Batal"
        tone="danger"
        onCancel={() => setCloseAsk(false)}
        onConfirm={() => {
          setFriendList([]);
          setCloseAsk(false);
          setFriendOpen(false);
        }}
      />


      <ConfirmDialog
        open={submitAsk}
        title="Konfirmasi penjemputan"
        description={
          <>
            Anda akan mengajukan penjemputan untuk{" "}
            <span className="font-semibold text-ink">{selected.length} siswa</span>
            {friendList.length > 0 ? ` dan ${friendList.length} teman` : ""}. Pastikan seluruh nama sudah benar sebelum
            melanjutkan.
          </>
        }
        confirmLabel="Ya, Lanjutkan"
        cancelLabel="Periksa Lagi"
        onCancel={() => setSubmitAsk(false)}
        onConfirm={() => {
          setSubmitAsk(false);
          goNext();
        }}
      />

    </PhoneShell>
  );
}
