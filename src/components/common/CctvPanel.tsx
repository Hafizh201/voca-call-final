import { useEffect, useState } from "react";
import { useSyncExternalStore } from "react";
import { getCctvLogs, subscribeCctv, clearCctvLogs, type CctvLogEntry } from "@/lib/pickup/history";
import { cn } from "@/lib/utils";
import { X, Trash2, Video } from "lucide-react";

/**
 * CCTV PANEL (debug backend)
 * Menampilkan log INSERT/UPDATE pemanggilan ke Supabase secara realtime.
 * Dibuka dengan keyboard shortcut `Ctrl+Shift+C` atau tombol kamera di pojok.
 * Hanya untuk membantu verifikasi — tidak mengubah flow utama.
 */
export function CctvPanel() {
  const logs = useSyncExternalStore(subscribeCctv, getCctvLogs, () => []);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {/* Tombol kamera melayang (hanya saat dev bisa dicek) */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Buka CCTV pemantau"
        className={cn(
          "fixed bottom-24 right-4 z-[60] grid h-11 w-11 place-items-center rounded-2xl shadow-card transition active:scale-95",
          open ? "bg-primary text-primary-foreground" : "bg-surface text-primary border border-border",
        )}
      >
        <Video className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/40 p-3 backdrop-blur-sm">
          <div className="flex h-[70vh] w-full max-w-[480px] flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-elevated">
            <div className="flex items-center justify-between border-b border-border/70 bg-surface-2/70 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Video className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-display text-sm font-bold text-ink">CCTV Pemantau</p>
                  <p className="text-[10px] text-muted-foreground">Riwayat pemanggilan · Ctrl+Shift+C</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={clearCctvLogs}
                  aria-label="Bersihkan log"
                  className="grid h-8 w-8 place-items-center rounded-xl bg-surface-2 text-muted-foreground active:scale-95"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Tutup"
                  className="grid h-8 w-8 place-items-center rounded-xl bg-surface-2 text-muted-foreground active:scale-95"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-border/60 px-4 py-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {logs.length} log
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-success">
                <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
                LIVE
              </span>
            </div>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3 font-mono text-[11px]">
              {logs.length === 0 ? (
                <p className="p-4 text-center text-muted-foreground">
                  Belum ada aktivitas. Mulai pemanggilan lalu pantau di sini.
                </p>
              ) : (
                logs.map((l) => <CctvRow key={l.id} log={l} />)
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CctvRow({ log }: { log: CctvLogEntry }) {
  const color =
    log.type === "error"
      ? "border-destructive/40 bg-destructive/5 text-destructive"
      : log.type === "ok"
        ? "border-success/40 bg-success/5 text-success-foreground"
        : log.type === "warn"
          ? "border-warning/40 bg-warning/5 text-warning-foreground"
          : "border-border bg-surface-2 text-foreground";

  const badge =
    log.type === "error"
      ? "bg-destructive text-destructive-foreground"
      : log.type === "ok"
        ? "bg-success text-success-foreground"
        : log.type === "warn"
          ? "bg-warning text-warning-foreground"
          : "bg-primary/10 text-primary";

  return (
    <div className={cn("rounded-xl border p-2.5", color)}>
      <div className="flex items-center justify-between gap-2">
        <span className={cn("shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-black", badge)}>
          {log.action}
        </span>
        <span className="truncate text-[10px] font-bold">{log.table}</span>
        <span className="shrink-0 text-[9px] text-muted-foreground">{log.ts}</span>
      </div>
      <p className="mt-1 truncate text-[10px] font-semibold">{log.message}</p>
      {log.idPemanggilan && (
        <p className="mt-0.5 truncate text-[9px] opacity-80">id_pemanggilan: {log.idPemanggilan}</p>
      )}
      {typeof log.callCount === "number" && (
        <p className="text-[9px] opacity-80">jumlah_pemanggilan: {log.callCount}</p>
      )}
      {log.detail && <p className="mt-0.5 break-words text-[9px] opacity-70">{log.detail}</p>}
    </div>
  );
}
