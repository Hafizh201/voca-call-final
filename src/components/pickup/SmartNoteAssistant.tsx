import { useState, useEffect } from "react";
import { MAX_NOTE, detectBadWords, politeCorrection, suggestionsFor } from "@/lib/validation/note";
import { Sparkles, Wand2, AlertTriangle, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";

export function SmartNoteAssistant({
  method,
  value,
  onChange,
  extras,
  onExtrasChange,
  onValidityChange,
  onBlur,
}: {
  method: "self" | "other" | "ojek";
  value: string;
  onChange: (v: string) => void;
  extras: string[];
  onExtrasChange: (v: string[]) => void;
  onValidityChange?: (valid: boolean) => void;
  onBlur?: () => void;
}) {
  const [bad, setBad] = useState<string[]>([]);
  const remaining = MAX_NOTE - value.length;
  const templates = suggestionsFor(method).slice(0, 3);

  useEffect(() => {
    const b = detectBadWords(value);
    setBad(b);
    onValidityChange?.(b.length === 0 && value.length <= MAX_NOTE);
  }, [value, onValidityChange]);

  const toggle = (s: string) => {
    onExtrasChange(extras.includes(s) ? extras.filter((x) => x !== s) : [...extras, s]);
    onBlur?.();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="flex items-center justify-between px-1 text-xs font-semibold text-muted-foreground">
          <span>Catatan untuk pengumuman</span>
          <span className={cn(remaining < 10 && "text-warning-foreground", remaining < 0 && "text-destructive")}>
            {remaining} karakter
          </span>
        </label>
        <div
          className={cn(
            "rounded-3xl border bg-surface p-4 shadow-card transition",
            bad.length > 0 ? "border-destructive/50" : "border-border",
          )}
        >
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value.slice(0, MAX_NOTE))}
            onBlur={onBlur}
            rows={3}
            placeholder="Tulis catatan singkat (opsional)"
            className="w-full resize-none bg-transparent text-sm leading-relaxed text-ink outline-none placeholder:text-muted-foreground/60"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> AI Auto-Correct
            </div>
            <button
              type="button"
              onClick={() => {
                onChange(politeCorrection(value));
                onBlur?.();
              }}
              disabled={!value.trim()}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary transition active:scale-95 disabled:opacity-40"
            >
              <Wand2 className="h-3.5 w-3.5" /> Perbaiki bahasa
            </button>
          </div>
        </div>
        {bad.length > 0 && (
          <div className="flex items-start gap-2 rounded-2xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Catatan mengandung kata tidak sesuai ({bad.join(", ")}). Mohon perbaiki sebelum mengirim.</p>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-card">
        <header className="flex items-center justify-between gap-3 border-b border-border/70 bg-surface-2/70 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/10">
              <ListChecks className="h-4 w-4 text-primary" />
            </span>
            <div>
              <p className="font-display text-sm font-bold text-ink">Catatan Penting</p>
              <p className="text-[11px] text-muted-foreground">Pilih </p>
            </div>
          </div>
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
            {extras.length}/{templates.length}
          </span>
        </header>
        <ul className="divide-y divide-border/60">
          {templates.map((s) => {
            const on = extras.includes(s);
            return (
              <li key={s} className={cn("flex items-center gap-3 px-4 py-3 transition", on && "bg-primary/5")}>
                <span
                  className={cn(
                    "min-w-0 flex-1 text-[12px] font-medium leading-snug transition",
                    on ? "text-ink" : "text-muted-foreground",
                  )}
                >
                  {s}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-label={s}
                  onClick={() => toggle(s)}
                  className={cn(
                    "relative h-6 w-11 shrink-0 rounded-full transition active:scale-95",
                    on ? "bg-primary" : "bg-border",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-5 w-5 rounded-full bg-background shadow-card transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      on ? "left-[1.4rem]" : "left-0.5",
                    )}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
