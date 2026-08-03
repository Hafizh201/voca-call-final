import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/layout/PlaceholderPage";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/trusted-pickup")({
  head: () => ({
    meta: [
      { title: "Trusted Pickup — Panggil" },
      { name: "description", content: "Daftar orang yang diizinkan menjemput anak Anda." },
      { property: "og:title", content: "Trusted Pickup" },
      { property: "og:description", content: "Kelola penjemput terpercaya." },
    ],
  }),
  component: () => (
    <PlaceholderPage title="Trusted Pickup" back="/profile" icon={<ShieldCheck className="h-6 w-6" />} body="Fitur daftar penjemput terpercaya akan aktif segera." />
  ),
});
