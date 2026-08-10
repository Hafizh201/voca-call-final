import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { QrCode, Copy, ScanLine } from "lucide-react";
import { notify } from "@/lib/state/notificationStore";

export function QrTicket({ code, announcement }: { code: string; announcement: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(`PANGGIL:${code}`, {
      width: 512,
      margin: 1,
      color: { dark: "#1e2547", light: "#ffffff" },
    })
      .then((url) => alive && setSrc(url))
      .catch(() => alive && setSrc(null));
    return () => {
      alive = false;
    };
  }, [code]);

  return (
    <div className="mx-5 overflow-hidden rounded-3xl border border-border bg-surface shadow-card">
      <header className="flex items-center gap-2 border-b border-border/70 bg-surface-2/70 px-4 py-3">
        <QrCode className="h-4 w-4 text-primary" />
        <p className="font-display text-sm font-bold text-ink">Tiket QR Penjemputan</p>
      </header>

      <div className="flex flex-col items-center px-5 py-5">
        <div className="rounded-3xl border border-border bg-white p-3 shadow-card">
          {src ? (
            <img src={src} alt={`Kode QR penjemputan ${code}`} className="h-40 w-40" />
          ) : (
            <div className="h-40 w-40 animate-pulse rounded-2xl bg-surface-2" />
          )}
        </div>
        <p className="mt-4 font-display text-2xl font-bold tracking-[0.2em] text-ink">{code}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">Tunjukkan kode ini kepada petugas gerbang</p>

        <button
          onClick={() => {
            navigator.clipboard?.writeText(code);
            notify("Kode penjemputan disalin", "Kode QR telah disalin ke clipboard.", "success");
          }}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-[11px] font-semibold text-foreground transition active:scale-95"
        >
          <Copy className="h-3.5 w-3.5" /> Salin kode
        </button>
      </div>

      <div className="border-t border-dashed border-border px-4 py-3">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary">
          <ScanLine className="h-3.5 w-3.5" /> Teks yang akan dipanggilkan
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-ink">“{announcement}”</p>
      </div>
    </div>
  );
}
