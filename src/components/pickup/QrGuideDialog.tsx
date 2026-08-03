import { useEffect } from "react";
import { QrCode, ScanLine, ShieldCheck, Clock3 } from "lucide-react";

const STEPS = [
  {
    icon: QrCode,
    title: "Kode QR dibuat otomatis",
    body: "Setelah permintaan dikirim, kode QR unik muncul di halaman monitoring.",
  },
  {
    icon: ScanLine,
    title: "Tunjukkan saat tiba",
    body: "Perlihatkan kode QR kepada petugas gerbang untuk dipindai.",
  },
  {
    icon: Clock3,
    title: "Tanpa estimasi waktu",
    body: "Pemanggilan baru diputar setelah QR berhasil dipindai, jadi Ananda tidak menunggu terlalu lama.",
  },
  {
    icon: ShieldCheck,
    title: "Satu kode satu penjemputan",
    body: "Kode hangus setelah dipakai dan tidak boleh dibagikan ke orang lain.",
  },
];

export function QrGuideDialog({
  open,
  onAccept,
  onDecline,
}: {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDecline();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onDecline]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Tutup"
        onClick={onDecline}
        className="absolute inset-0 animate-fade-in bg-ink/50 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-[440px] animate-scale-in overflow-hidden rounded-t-3xl border border-border bg-surface shadow-card sm:rounded-3xl"
      >
        <div className="flex items-center gap-3 bg-gradient-hero px-5 py-4 text-primary-foreground">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/15">
            <QrCode className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-base font-bold">Cara Pakai Sistem QR</h2>
            <p className="text-[11px] text-white/80">Baca dulu sebelum melanjutkan</p>
          </div>
        </div>

        <ol className="divide-y divide-border/60">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex items-start gap-3 px-5 py-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <s.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="font-display text-[13px] font-bold text-ink">
                  {i + 1}. {s.title}
                </p>
                <p className="text-[11px] leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="flex gap-2 border-t border-border bg-surface-2/60 p-4">
          <button
            type="button"
            onClick={onDecline}
            className="flex-1 rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-bold text-foreground transition active:scale-95"
          >
            Tidak, pakai "Sudah Sampai"
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="flex-1 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition active:scale-95"
          >
            Saya Mengerti
          </button>
        </div>
      </div>
    </div>
  );
}
