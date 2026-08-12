import { ChevronDown } from "lucide-react";
import { formatPlate, isValidPlate } from "@/lib/format/utils";
import { cn } from "@/lib/utils";

export function DropdownField({
  label,
  value,
  onChange,
  options,
  hint,
  onBlur,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  hint?: string;
  onBlur?: () => void;
}) {
  return (
    <div className="space-y-1">
      <label className="px-1 text-xs font-semibold text-muted-foreground">{label}</label>
      <div className="relative rounded-2xl border border-border bg-surface shadow-card">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className="w-full appearance-none rounded-2xl bg-transparent px-3 py-3.5 pr-10 text-sm font-semibold text-ink outline-none"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
      {hint && <p className="px-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}


export function PlateInput({ value, onChange, onBlur }: { value: string; onChange: (v: string) => void; onBlur?: () => void }) {
  const formatted = formatPlate(value);
  const valid = value.length === 0 || isValidPlate(value);
  return (
    <div className="space-y-1">
      <label className="px-1 text-xs font-semibold text-muted-foreground">Plat nomor kendaraan</label>
      <div className={cn("rounded-2xl border bg-surface p-3 shadow-card transition", valid ? "border-border" : "border-destructive/50")}>
        <input
          value={formatted}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
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
  onBlur,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  onBlur?: () => void;
}) {
  return (
    <div className="space-y-1">
      <label className="px-1 text-xs font-semibold text-muted-foreground">{label}</label>
      <div className="rounded-2xl border border-border bg-surface p-3 shadow-card">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
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
  onBlur,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  onBlur?: () => void;
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
              onClick={() => {
                onChange(o.value);
                onBlur?.();
              }}
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
