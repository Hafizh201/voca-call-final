import { supabase } from "@/lib/supabase";
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
const [loading, setLoading] = useState(false);
const [errorMessage, setErrorMessage] = useState("");
  useEffect(() => {
    if (!session.username) nav({ to: "/login" });
  }, [session.username, nav]);

useEffect(() => {
    if (pin.length !== 4) return;

    async function verifyPin() {
        setLoading(true);
        setErrorMessage("");

        const { data } = await supabase
            .from("users")
            .select("*")
            .eq("username", session.username)
            .eq("pin", pin)
            .single();

        if (data) {
            sessionStore.set({
                signedIn: true,
            });

            setTimeout(() => {
                nav({ to: "/dashboard" });
            }, 350);

            return;
        }

        setLoading(false);

        setShake(true);
        setErrorMessage("PIN yang Anda masukkan salah.");

        setTimeout(() => {
            setShake(false);
            setPin("");
        }, 600);
    }

    verifyPin();
}, [pin]);

  return (
    <PhoneShell padded={false}>
      <div className="flex min-h-screen flex-col px-6 pt-14">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Halo, {session.username}</p>
        <h1 className="mt-2 font-display text-2xl font-bold text-ink">Masukkan PIN Anda</h1>
        <p className="mt-1 text-xs text-muted-foreground">Gunakan 4 digit PIN. Untuk demo, PIN adalah 1234.</p>

        <div className="mt-10 mb-8">
          <PinDots length={4} filled={pin.length} shake={shake} />
        </div>
        <div className="mt-3 h-5">
          <p className={`text-center text-xs text-red-500 transition-all duration-200 ${
                errorMessage
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-1"
              }`}
              >
                {errorMessage}
          </p>
        </div>

        <PinKeypad
          onDigit={(d) => {
    setErrorMessage("");
    setPin((p) => (p.length < 4 ? p + d : p));
}}
          onBackspace={() => setPin((p) => p.slice(0, -1))}
        />

        <Link to="/login" className="mx-auto mt-6 text-xs font-semibold text-primary">
          Lupa PIN? Hubungi admin
        </Link>
      </div>
    </PhoneShell>
  );
}