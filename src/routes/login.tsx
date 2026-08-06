import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { BigButton } from "@/components/common/BigButton";
import { LogIn } from "lucide-react";
import { sessionStore } from "@/lib/state/stores";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Masuk — Panggil" },
      {
        name: "description",
        content: "Masuk ke aplikasi Panggil menggunakan username wali murid.",
      },
      { property: "og:title", content: "Masuk — Panggil" },
      {
        property: "og:description",
        content: "Autentikasi dua tahap yang sederhana.",
      },
    ],
  }),
  component: LoginUsername,
});

function LoginUsername() {
  const [username, setUsername] = useState("");
  const nav = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const canContinue = username.trim().length >= 3;

  return (
    <PhoneShell padded={false}>
      <div className="flex min-h-screen flex-col px-6 pt-16">
        {/* Icon */}
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <LogIn className="h-6 w-6" />
        </div>

        {/* Heading */}
        <h1 className="mt-8 font-display text-3xl font-bold text-ink">
          Selamat datang
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Masukkan username wali murid Anda untuk melanjutkan.
        </p>

        {/* Username */}
        <div className="mt-8">
          <label className="mb-2 block text-sm font-medium text-ink">
            Username
          </label>

          <div className="flex h-14 overflow-hidden rounded-full border border-border bg-background shadow-sm transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            {/* Prefix @ */}
            <div className="flex items-center justify-center border-r border-border bg-muted px-5 text-lg font-semibold text-muted-foreground select-none">
              @
            </div>

            {/* Input */}
            <input
              type="text"
              value={username}
              onChange={(e) => {
                  setUsername(e.target.value);
                  if (errorMessage) setErrorMessage("");
                  }}
              placeholder="wali.user"
              autoComplete="username"
              spellCheck={false}
              className="flex-1 bg-transparent px-4 text-base text-foreground outline-none placeholder:text-muted-foreground"
            />
            
          </div>
        </div><div className="mt-2 min-h-[20px]">
               <p
        className={`text-xs text-red-500 transition-all duration-200 ${
            errorMessage
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-1"
        }`}
                  >
        {errorMessage}
           </p>
            </div>

        {/* Help */}
        <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
          Belum memiliki akun? Silakan hubungi Tata Usaha sekolah untuk
          mendapatkan username Anda.
        </p>

        {/* Button */}
        <div className="mt-auto pb-10 pt-8">
          <BigButton
            disabled={!canContinue}
              onClick={async () => {
                  if (loading) return;

                  setLoading(true);
                  setErrorMessage("");

                  const usernameInput = username.trim();

                  const { data, error } = await supabase
                      .from("users")
                      .select("*")
                      .eq("username", usernameInput)
                      .single();

                  if (error || !data) {
                      setLoading(false);
                      setErrorMessage("Username tidak ditemukan.");
                      return;
                  }

                  sessionStore.set({
                      username: usernameInput,
                      signedIn: false,
                  });

                  nav({ to: "/login/pin" });
              }}
          >
            Lanjut
          </BigButton>
        </div>
      </div>
    </PhoneShell>
  );
}