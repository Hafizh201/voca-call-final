import { formatPlate, isValidPlate } from "@/lib/format/utils";
import { cn } from "@/lib/utils";

export function PlateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const formatted = formatPlate(value);
  const valid = value.length === 0 || isValidPlate(value);
  return (
    <div className="space-y-1">
      <label className="px-1 text-xs font-semibold text-muted-foreground">Plat nomor kendaraan</label>
      <div className={cn("rounded-2xl border bg-surface p-3 shadow-card transition", valid ? "border-border" : "border-destructive/50")}>
        <input
          value={formatted}
          onChange={(e) => onChange(e.target.value)}
          placeholder="B 1234 XYZ"
          inputMode="text"
          autoCapitalize="characters"
          className="w-full bg-transparent font-display text-lg font-bold uppercase tracking-widest text-ink outline-none placeholder:text-muted-foreground/60"
        />
      </div>
      {!valid && (
        <p className="px-1 text-[11px] text-destructive">Format plat belum sesuai. Contoh: B 1234 XYZ.</p>
      )}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="px-1 text-xs font-semibold text-muted-foreground">{label}</label>
      <div className="rounded-2xl border border-border bg-surface p-3 shadow-card">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted-foreground/60"
        />
      </div>
      {hint && <p className="px-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="space-y-1">
      <label className="px-1 text-xs font-semibold text-muted-foreground">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              className={cn(
                "rounded-2xl border px-3 py-2 text-xs font-semibold transition active:scale-95",
                active ? "border-primary bg-primary text-primary-foreground shadow-card" : "border-border bg-surface text-foreground",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
