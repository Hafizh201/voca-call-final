import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { sessionStore } from "@/lib/state/stores";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { Megaphone } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Panggil — Aplikasi Penjemputan Siswa" },
      { name: "description", content: "Aplikasi pendamping penjemputan siswa yang tenang, jelas, dan mudah." },
      { property: "og:title", content: "Panggil — Aplikasi Penjemputan Siswa" },
      { property: "og:description", content: "Pendamping digital untuk penjemputan siswa." },
    ],
  }),
  component: Splash,
});

function Splash() {
  const nav = useNavigate();
  useEffect(() => {
    const t = setTimeout(() => {
      const { signedIn } = sessionStore.get();
      nav({ to: signedIn ? "/dashboard" : "/login" });
    }, 1200);
    return () => clearTimeout(t);
  }, [nav]);

  return (
    <PhoneShell padded={false}>
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-hero px-8 text-primary-foreground">
        <div className="grid h-24 w-24 place-items-center rounded-3xl bg-white/15 shadow-glow animate-scale-in">
          <Megaphone className="h-10 w-10" />
        </div>
        <h1 className="mt-6 font-montserrat text-6xl font-extrabold tracking-[5px]">VOCA</h1>
        <p className="mt-2 text-xs text-white/70 italic">School Voice Announcement Platform</p>
        <div className="mt-10 flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-white/80 animate-pulse" />
          <span className="h-2 w-2 rounded-full bg-white/60 animate-pulse [animation-delay:150ms]" />
          <span className="h-2 w-2 rounded-full bg-white/40 animate-pulse [animation-delay:300ms]" />
        </div>
      </div>
    </PhoneShell>
  );
}
