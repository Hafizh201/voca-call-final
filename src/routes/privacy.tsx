import { createFileRoute } from "@tanstack/react-router";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { TopBar } from "@/components/layout/TopBar";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Kebijakan Privasi — Panggil" },
      {
        name: "description",
        content: "Kebijakan privasi dan ketentuan layanan penggunaan sistem penjemputan siswa digital.",
      },
      { property: "og:title", content: "Kebijakan Privasi & Ketentuan Layanan" },
      { property: "og:description", content: "Aturan penggunaan sistem penjemputan siswa digital." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Privacy,
});

const sections = [
  {
    title: "Penggunaan yang Bertanggung Jawab",
    body: "Fitur penjemputan hanya boleh digunakan oleh wali murid yang berhak. Menambahkan nama siswa lain tanpa izin, bercanda, atau prank merupakan pelanggaran.",
  },
  {
    title: "Data yang Kami Simpan",
    body: "Kami menyimpan nama siswa, kelas, waktu permintaan penjemputan, serta identitas penjemput untuk keperluan keamanan sekolah.",
  },
  {
    title: "Jejak Aktivitas",
    body: "Setiap permintaan penjemputan tercatat lengkap dengan waktu dan akun pembuatnya, dan dapat ditinjau oleh pihak sekolah kapan saja.",
  },
  {
    title: "Sanksi",
    body: "Penyalahgunaan dapat berakibat pembatasan akses akun dan tindak lanjut dari pihak sekolah sesuai tata tertib yang berlaku.",
  },
];

function Privacy() {
  return (
    <PhoneShell>
      <TopBar title="Kebijakan Privasi" back="/dashboard" subtitle="Ketentuan layanan penjemputan" />
      <div className="space-y-3 p-5">
        {sections.map((s) => (
          <section key={s.title} className="rounded-3xl border border-border bg-surface p-4 shadow-card">
            <h2 className="font-display text-sm font-bold text-ink">{s.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          </section>
        ))}
      </div>
    </PhoneShell>
  );
}
