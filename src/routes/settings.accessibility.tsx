import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/layout/PlaceholderPage";
import { Accessibility } from "lucide-react";

export const Route = createFileRoute("/settings/accessibility")({
  head: () => ({
    meta: [
      { title: "Aksesibilitas — Panggil" },
      { name: "description", content: "Sesuaikan ukuran teks, kontras, dan animasi." },
      { property: "og:title", content: "Aksesibilitas" },
      { property: "og:description", content: "Nyaman untuk semua usia." },
    ],
  }),
  component: () => (
    <PlaceholderPage title="Aksesibilitas" back="/settings" icon={<Accessibility className="h-6 w-6" />} body="Pengaturan ukuran teks, kontras, dan motion akan tersedia di iterasi berikutnya. Mode Lansia sudah aktif dari halaman Profil." />
  ),
});
