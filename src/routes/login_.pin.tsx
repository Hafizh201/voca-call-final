import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { PinDots, PinKeypad } from "@/components/common/Pin";
import { sessionStore, useSession } from "@/lib/state/stores";

export const Route = createFileRoute("/login_/pin")({
  head: () => ({
    meta: [
      { title: "PIN — Panggil" },
      { name: "description", content: "Masukkan 4 digit PIN untuk masuk ke Panggil." },
      { property: "og:title", content: "PIN — Panggil" },
      { property: "og:description", content: "Autentikasi PIN 4 digit yang aman dan sederhana." },
    ],
  }),
  component: LoginPin,
});

function LoginPin() {
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const session = useSession();
  const nav = useNavigate();

  useEffect(() => {
    if (!session.username) nav({ to: "/login" });
  }, [session.username, nav]);

  useEffect(() => {
    if (pin.length !== 4) return;
    if (pin === "1234") {
      sessionStore.set({ signedIn: true });
      setTimeout(() => nav({ to: "/dashboard" }), 200);
    } else {
      setShake(true);
      setTimeout(() => {
        setShake(false);
        setPin("");
      }, 500);
    }
  }, [pin, nav]);

  return (
    <PhoneShell padded={false}>
      <div className="flex min-h-screen flex-col px-6 pt-14">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Halo, {session.username}</p>
        <h1 className="mt-2 font-display text-2xl font-bold text-ink">Masukkan PIN Anda</h1>
        <p className="mt-1 text-xs text-muted-foreground">Gunakan 4 digit PIN. Untuk demo, PIN adalah 1234.</p>

        <div className="mt-10 mb-8">
          <PinDots length={4} filled={pin.length} shake={shake} />
        </div>

        <PinKeypad
          onDigit={(d) => setPin((p) => (p.length < 4 ? p + d : p))}
          onBackspace={() => setPin((p) => p.slice(0, -1))}
        />

        <Link to="/login" className="mx-auto mt-6 text-xs font-semibold text-primary">
          Lupa PIN? Hubungi admin
        </Link>
      </div>
    </PhoneShell>
  );
}
