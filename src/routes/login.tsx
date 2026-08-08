import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { BigButton } from "@/components/common/BigButton";
import { Loader2, LogIn } from "lucide-react";
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
              disabled={loading}
              className="flex-1 bg-transparent px-4 text-base text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-50"
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
            disabled={loading}
              onClick={async () => {
                  if (loading) return;

                  const usernameInput = username.trim();

                  if (!usernameInput) {
                      setErrorMessage("Username wajib diisi.");
                      return;
                  }

                  setLoading(true);
                  setErrorMessage("");

const { data, error } = await supabase
                      .from("users")
                      .select("username, nama_walmur, status_user")
                      .eq("username", usernameInput)
                      .single();

                  if (error) {
                      setLoading(false);
                      setErrorMessage("Login belum dapat diproses. Silakan coba lagi.");
                      return;
                  }

                  if (!data) {
                      setLoading(false);
                      setErrorMessage("Username tidak ditemukan.");
                      return;
                  }

const namaWalmur = data?.nama_walmur;
                  const statusUser = data?.status_user;

                  sessionStore.set({
                      username: usernameInput,
                      namaWalmur: namaWalmur ?? null,
                      statusUser: statusUser ?? null,
                      signedIn: false,
                  });

                  nav({ to: "/login/pin" });
              }}
          >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Memproses…" : "Lanjut"}
          </BigButton>
        </div>
      </div>
    </PhoneShell>
  );
}