import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";

export function PinDots({ length, filled, shake }: { length: number; filled: number; shake?: boolean }) {
  return (
    <div className={cn("flex items-center justify-center gap-4", shake && "animate-shake")}>
      {Array.from({ length }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-4 w-4 rounded-full border-2 border-primary/40 transition",
            i < filled && "border-primary bg-primary",
          )}
        />
      ))}
    </div>
  );
}

export function PinKeypad({
  onDigit,
  onBackspace,
  disabled,
}: {
  onDigit: (d: string) => void;
  onBackspace: () => void;
  disabled?: boolean;
}) {
  const keys = ["1","2","3","4","5","6","7","8","9","","0","<"];
  return (
    <div className="grid grid-cols-3 gap-3">
      {keys.map((k, i) => {
        if (k === "") return <div key={i} />;
        const isBs = k === "<";
        return (
          <button
            key={i}
            type="button"
            disabled={disabled}
            onClick={() => (isBs ? onBackspace() : onDigit(k))}
            className="grid h-16 place-items-center rounded-2xl bg-surface-2 font-display text-2xl font-bold text-ink shadow-card transition active:scale-95 active:bg-primary/10 disabled:opacity-40"
          >
            {isBs ? <Delete className="h-6 w-6 text-muted-foreground" /> : k}
          </button>
        );
      })}
    </div>
  );
}
