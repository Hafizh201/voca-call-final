import { type ReactNode, useEffect } from "react";
import { X } from "lucide-react";

export function BottomSheet({
  open,
  title,
  description,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Tutup"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-ink/50 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="absolute inset-x-0 bottom-0 mx-auto flex h-[52vh] w-full max-w-[480px] animate-slide-up flex-col rounded-t-3xl border border-border bg-surface shadow-card"
      >
        <div className="flex items-start gap-3 border-b border-border/60 px-5 pb-3 pt-4">
          <div className="min-w-0 flex-1">
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border" />
            <h2 className="font-display text-base font-bold text-ink">{title}</h2>
            {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="mt-2 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-surface-2 text-muted-foreground active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && <div className="border-t border-border/60 px-5 pb-6 pt-3">{footer}</div>}
      </div>
    </div>
  );
}
