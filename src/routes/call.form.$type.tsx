import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { usePageReady } from "@/hooks/use-page-ready";
import { FormSkeleton } from "@/components/feedback/Skeletons";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { TopBar } from "@/components/layout/TopBar";
import { BigButton } from "@/components/common/BigButton";
import { TextField, SelectField, DropdownField } from "@/components/pickup/Fields";
import { EmptyState } from "@/components/feedback/EmptyState";
import { useStudents, type Student } from "@/lib/students";
import { createCall } from "@/lib/call/stores";
import { Users, PackageOpen, UserRoundCheck } from "lucide-react";
import { toast } from "sonner";

const searchSchema = z.object({ s: z.string().default("") });

export const Route = createFileRoute("/call/form/$type")({
  validateSearch: (s) => searchSchema.parse(s),
  head: ({ params }) => ({
    meta: [
      {
        title:
          params.type === "titipan" ? "Form Ambil Titipan — Panggil" : "Form Panggil Ditunggu — Panggil",
      },
      {
        name: "description",
        content:
          params.type === "titipan"
            ? "Isi data titipan untuk Ananda: penitip, jenis titipan, dan pesan singkat."
            : "Isi data pemanggilan: siapa yang menunggu, posisi tunggu, dan pesan singkat.",
      },
      {
        property: "og:title",
        content: params.type === "titipan" ? "Form Ambil Titipan" : "Form Panggil Ditunggu",
      },
      {
        property: "og:description",
        content: "Formulir singkat tanpa langkah rumit.",
      },
    ],
  }),
  component: CallFormPage,
});

const POSISI_TUNGGU = [
  "Pos Satpam",
  "Gerbang Utama",
  "Gerbang Belakang",
  "Lobi Sekolah",
  "Area Parkir",
  "Ruang Tamu",
];

const JENIS_TITIPAN = ["Makanan", "Minuman", "Uang", "Buku / Alat Tulis", "Pakaian / Seragam", "Barang Lain"];

function CallFormPage() {
  const ready = usePageReady();
  const { type } = Route.useParams() as { type: string };
  const { s: sParam } = Route.useSearch();
  const isTitipan = type === "titipan";
  const nav = useNavigate();
  const { students } = useStudents();

  const [ditungguOleh, setDitungguOleh] = useState("");
  const [posisiTunggu, setPosisiTunggu] = useState(POSISI_TUNGGU[0]);
  const [namaPenitip, setNamaPenitip] = useState("");
  const [jenisTitipan, setJenisTitipan] = useState(JENIS_TITIPAN[0]);
  const [shortMessg, setShortMessg] = useState("");
  const [method, setMethod] = useState("speaker");

  if (!ready) return <FormSkeleton />;

  if (type !== "titipan" && type !== "ditunggu") {
    return (
      <PhoneShell>
        <TopBar title="Panggil" back="/call/method" />
        <div className="p-5">
          <EmptyState
            title="Jenis panggilan tidak dikenal"
            body="Silakan pilih kembali jenis panggilan yang ingin dibuat."
            action={<BigButton onClick={() => nav({ to: "/call/method" })}>Pilih Jenis Panggilan</BigButton>}
          />
        </div>
      </PhoneShell>
    );
  }

  const active: Student[] = (students ?? []).filter((s) => s && s.name?.trim() && !s.pendingApproval);
  const chosenIds = sParam.split(",").filter(Boolean);
  const chosenStudents = active.filter((s) => chosenIds.includes(s.id));
  const chosen = chosenStudents.map((s) => s.id);

  if (chosen.length === 0) {
    return (
      <PhoneShell>
        <TopBar title={isTitipan ? "Ambil Titipan" : "Panggil Ditunggu"} back="/call/method" />
        <div className="p-5">
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="Belum ada siswa dipilih"
            body="Silakan pilih dulu siswa yang akan dipanggil."
            action={
              <BigButton onClick={() => nav({ to: "/call/select", search: { t: isTitipan ? "titipan" : "ditunggu" } })}>
                Pilih Siswa
              </BigButton>
            }
          />
        </div>
      </PhoneShell>
    );
  }

  const canSubmit =
    chosen.length > 0 && (isTitipan ? namaPenitip.trim().length > 1 : ditungguOleh.trim().length > 1);

  const submit = () => {
    if (!canSubmit) return;
    createCall(
      isTitipan
        ? {
            type: "titipan",
            studentIds: chosen,
            namaPenitip: namaPenitip.trim(),
            jenisTitipan,
            shortMessg: shortMessg.trim(),
            method,
          }
        : {
            type: "ditunggu",
            studentIds: chosen,
            ditungguOleh: ditungguOleh.trim(),
            posisiTunggu,
            shortMessg: shortMessg.trim(),
            method,
          },
    );
    toast.success(isTitipan ? "Panggilan titipan dikirim" : "Panggilan ditunggu dikirim");
    nav({ to: "/call/monitoring" });
  };

  return (
    <PhoneShell>
      <TopBar
        title={isTitipan ? "Ambil Titipan" : "Panggil Ditunggu"}
        back="/call/select"
        subtitle={isTitipan ? "Ada titipan untuk Ananda" : "Ananda ditunggu seseorang"}
      />

      <div className="space-y-4 p-5 pb-32">
        <section className="overflow-hidden rounded-3xl border border-border bg-surface shadow-card">
          <header className="flex items-center justify-between border-b border-border/70 bg-surface-2/70 px-4 py-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <p className="font-display text-sm font-bold text-ink">Siswa yang dipanggil</p>
            </div>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
              {chosen.length} Siswa
            </span>
          </header>
          <ul className="divide-y divide-border/60">
            {chosenStudents.map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-4 py-3">
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl font-display text-sm font-bold text-white"
                  style={{ backgroundColor: s.avatarColor }}
                >
                  {s.name[0]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-bold text-ink">{s.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {s.className ? `Kelas ${s.className}` : "Kelas —"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {isTitipan ? (
          <>
            <TextField
              label="Nama penitip"
              value={namaPenitip}
              onChange={setNamaPenitip}
              placeholder="Contoh: Bapak Hafizh"
              hint="Nama orang yang menitipkan barang."
            />
            <DropdownField
              label="Jenis titipan"
              value={jenisTitipan}
              onChange={setJenisTitipan}
              options={JENIS_TITIPAN.map((v) => ({ value: v, label: v }))}
              hint="Keterangan barang yang dititipkan."
            />
          </>
        ) : (
          <>
            <TextField
              label="Ditunggu oleh"
              value={ditungguOleh}
              onChange={setDitungguOleh}
              placeholder="Contoh: Bapak Hafizh"
              hint="Nama orang yang sedang menunggu Ananda."
            />
            <DropdownField
              label="Posisi tunggu"
              value={posisiTunggu}
              onChange={setPosisiTunggu}
              options={POSISI_TUNGGU.map((v) => ({ value: v, label: v }))}
              hint="Tempat Ananda harus datang."
            />
          </>
        )}

        <TextField
          label="Pesan singkat"
          value={shortMessg}
          onChange={setShortMessg}
          placeholder={isTitipan ? "Contoh: Ada makanan untuk kamu" : "Contoh: Ayah sudah datang"}
          hint="Opsional, maksimal satu kalimat."
        />

        <SelectField
          label="Metode pemanggilan"
          value={method}
          onChange={setMethod}
          options={[
            { value: "speaker", label: "Pengeras Suara" },
            { value: "guru", label: "Lewat Guru Kelas" },
            { value: "petugas", label: "Petugas Menjemput" },
          ]}
        />

        <div className="flex items-start gap-3 rounded-3xl border border-border bg-surface-2/60 p-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            {isTitipan ? <PackageOpen className="h-4 w-4" /> : <UserRoundCheck className="h-4 w-4" />}
          </span>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {isTitipan
              ? "Status titipan (sudah diambil atau belum) bisa dipantau langsung dari beranda."
              : "Setelah Ananda sampai, tandai panggilan sebagai selesai dari beranda."}
          </p>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-[480px] border-t border-border bg-background/95 px-5 pb-6 pt-4 backdrop-blur">
        <BigButton disabled={!canSubmit} onClick={submit}>
          {isTitipan ? "Kirim Panggilan Titipan" : "Kirim Panggilan"}
        </BigButton>
      </div>
    </PhoneShell>
  );
}
