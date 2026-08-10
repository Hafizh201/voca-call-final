import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Share2, Link2, ScanLine, QrCode, ScanEye, CheckCircle2 } from "lucide-react";
import { notify } from "@/lib/state/notificationStore";
import { useNavigate } from "@tanstack/react-router";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { TopBar } from "@/components/layout/TopBar";
import { simulateScan, finishAndArchive } from "@/lib/pickup/simulator";
import { STAGE_LABELS, type PickupRequest } from "@/lib/state/stores";

function shareUrlFor(code: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/monitoring?code=${encodeURIComponent(code)}`;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export function QrOnlyMonitoring({ current }: { current: PickupRequest }) {
  const code = current.qrCode ?? "";
  const [src, setSrc] = useState<string | null>(null);
  const nav = useNavigate();
  const scanCount = current.scanCount ?? 0;
  const lastScannedAt = current.lastScannedAt ?? null;
  const isDone = current.stage === "done";

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(`PANGGIL:${code}`, {
      width: 720,
      margin: 1,
      color: { dark: "#1e2547", light: "#ffffff" },
    })
      .then((url) => alive && setSrc(url))
      .catch(() => alive && setSrc(null));
    return () => {
      alive = false;
    };
  }, [code]);

  const onShare = async () => {
    const url = shareUrlFor(code);
    const text = `Kode penjemputan: ${code}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "Kode Penjemputan", text, url });
        return;
      }
      await navigator.clipboard?.writeText(`${text}\n${url}`);
      notify("Kode & tautan disalin", "Kode penjemputan dan tautan telah disalin.", "success");
    } catch {
      /* dibatalkan pengguna */
    }
  };

  const onCopyLink = async () => {
    try {
      await navigator.clipboard?.writeText(shareUrlFor(code));
      notify("Tautan disalin", "Tautan penjemputan telah disalin ke clipboard.", "success");
    } catch {
      notify("Tidak dapat menyalin tautan", "Periksa izin clipboard lalu coba lagi.", "error");
    }
  };

  return (
    <PhoneShell>
      <TopBar title="Kode Penjemputan" back="/dashboard" subtitle="Sistem QR" />

      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 pb-8 pt-4">
        <div className="rounded-[2rem] border border-border bg-white p-5 shadow-elevated">
          {src ? (
            <img
              src={src}
              alt={`Kode QR penjemputan ${code}`}
              className="h-64 w-64 max-w-full"
            />
          ) : (
            <div className="h-64 w-64 animate-pulse rounded-3xl bg-surface-2" />
          )}
        </div>

        <p className="mt-6 font-display text-3xl font-bold tracking-[0.25em] text-ink">{code}</p>

        <p className="mt-3 max-w-xs text-center text-sm leading-relaxed text-muted-foreground">
          Berikan kode ini kepada penjemput. Petugas gerbang akan memindai QR atau memasukkan kode
          untuk memanggil Ananda.
        </p>

        <div className="mt-6 flex w-full max-w-xs flex-col gap-2">
          <button
            onClick={onShare}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-card transition active:scale-95"
          >
            <Share2 className="h-4 w-4" /> Bagikan kode
          </button>
          <button
            onClick={onCopyLink}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-surface text-sm font-semibold text-foreground transition active:scale-95"
          >
            <Link2 className="h-4 w-4" /> Salin tautan
          </button>
          <button
            onClick={() => {
              simulateScan();
              notify("QR dipindai petugas", "Simulasi pemindaian QR berhasil dijalankan.", "success");
            }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface-2 text-[13px] font-semibold text-muted-foreground transition active:scale-95"
          >
            <ScanEye className="h-4 w-4" /> Simulasikan scan (dummy)
          </button>
        </div>

        <div className="mt-8 flex w-full max-w-xs items-center gap-3 rounded-3xl border border-border bg-surface px-4 py-3 shadow-card">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-2 text-primary">
            {scanCount > 0 ? <ScanLine className="h-4 w-4" /> : <QrCode className="h-4 w-4" />}
          </span>
          <div className="min-w-0">
            <p className="font-display text-sm font-bold text-ink">
              {scanCount > 0 ? `Sudah dipindai ${scanCount}x` : "Belum dipindai"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {lastScannedAt
                ? `Pemindaian terakhir pukul ${formatTime(lastScannedAt)} · ${STAGE_LABELS[current.stage]}`
                : "Menunggu petugas gerbang memindai kode"}
            </p>
          </div>
        </div>

        {isDone && (
          <button
            onClick={() => {
              finishAndArchive();
              nav({ to: "/dashboard" });
            }}
            className="mt-4 inline-flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-card transition active:scale-95"
          >
            <CheckCircle2 className="h-4 w-4" /> Selesai
          </button>
        )}
      </div>
    </PhoneShell>
  );
}
