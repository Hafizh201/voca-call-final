import { type ReactNode, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Ya, Lanjutkan",
  cancelLabel = "Batal",
  tone = "primary",
  onConfirm,
  onCancel,
  children,
}: {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Tutup"
        onClick={onCancel}
        className="absolute inset-0 animate-fade-in bg-ink/50 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-[440px] animate-scale-in rounded-t-3xl border border-border bg-surface p-5 shadow-card sm:rounded-3xl"
      >
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-2xl",
              tone === "danger" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
            )}
          >
            <ShieldAlert className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-base font-bold text-ink">{title}</h2>
            <div className="mt-1 text-sm text-muted-foreground">{description}</div>
          </div>
        </div>

        {children && <div className="mt-4">{children}</div>}

        <p className="mt-4 rounded-2xl bg-surface-2 p-3 text-[11px] leading-relaxed text-muted-foreground">
          Dilarang menambahkan nama orang lain untuk bercanda atau prank. Setiap permintaan penjemputan tercatat dan
          dapat ditindaklanjuti sekolah. Baca{" "}
          <Link to="/privacy" className="font-semibold text-primary underline underline-offset-2">
            Kebijakan Privasi &amp; Ketentuan Layanan
          </Link>
          .
        </p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm font-bold text-foreground transition active:scale-95"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              "flex-1 rounded-2xl px-4 py-3 text-sm font-bold text-white transition active:scale-95",
              tone === "danger" ? "bg-destructive" : "bg-primary",
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
