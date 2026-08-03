import { useMemo, useState } from "react";
import { ArrowLeft, Check, Search, UserPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { friendClasses, friends, type Friend } from "@/lib/dummy/data";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

export function FriendPicker({
  open,
  selected,
  onAdd,
  onRemove,
}: {
  open: boolean;
  selected: Friend[];
  onAdd: (f: Friend) => void;
  onRemove: (id: string) => void;
}) {
  const [cls, setCls] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [pending, setPending] = useState<Friend | null>(null);

  const query = q.trim().toLowerCase();
  const results = useMemo(() => {
    if (!cls || query.length === 0) return [];
    return friends.filter((f) => f.className === cls && f.name.toLowerCase().includes(query));
  }, [cls, query]);


  return (
    <div
      aria-hidden={!open}
      className={cn(
        "grid transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
      )}
    >
      <div className="overflow-hidden">
        <div
          className={cn(
            "mt-3 rounded-3xl border border-border bg-surface p-4 shadow-card transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            open ? "translate-y-0 scale-100" : "-translate-y-3 scale-[0.98]",
          )}
        >
          {!cls ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground">Langkah 1 · Pilih kelas teman</p>
              <div className="flex flex-wrap gap-2">
                {friendClasses.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setCls(c);
                      setQ("");
                    }}
                    className="rounded-2xl border border-border bg-surface-2 px-4 py-2 text-sm font-bold text-ink transition active:scale-95 hover:border-primary hover:text-primary"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCls(null)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-semibold text-foreground transition active:scale-95"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Kembali
                </button>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
                  Kelas {cls}
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface-2 px-3 py-2.5">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Cari nama teman…"
                  className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted-foreground/60"
                />
              </div>

              <div className="space-y-2">
                {query.length === 0 && (
                  <p className="rounded-2xl bg-surface-2 px-3 py-3 text-xs leading-relaxed text-muted-foreground">
                    Ketik nama teman terlebih dahulu untuk menampilkan daftar. Daftar sengaja disembunyikan agar tidak
                    ada nama yang tertambah karena tidak sengaja tersentuh.
                  </p>
                )}
                {query.length > 0 && results.length === 0 && (
                  <p className="px-1 py-2 text-xs text-muted-foreground">Tidak ada nama yang cocok di kelas {cls}.</p>
                )}
                {results.map((f) => {
                  const added = selected.some((s) => s.id === f.id);
                  return (
                    <button
                      key={f.id}
                      type="button"
                      disabled={added}
                      onClick={() => setPending(f)}

                      className={cn(
                        "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.99]",
                        added ? "border-primary/40 bg-primary/5" : "border-border bg-surface",
                      )}
                    >
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-surface-2 font-display text-sm font-bold text-ink">
                        {f.name[0]}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-ink">{f.name}</span>
                        <span className="block text-[11px] text-muted-foreground">Kelas {f.className}</span>
                      </span>
                      {added ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : (
                        <UserPlus className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {selected.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-border pt-3">
              <p className="text-xs font-semibold text-muted-foreground">Teman dijemput bersama ({selected.length})</p>
              {selected.map((f) => (
                <div
                  key={f.id}
                  className="flex animate-scale-in items-center gap-3 rounded-2xl bg-surface-2 p-3"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">{f.name}</span>
                    <span className="block text-[11px] text-muted-foreground">Kelas {f.className}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemove(f.id)}
                    aria-label={`Hapus ${f.name}`}
                    className="grid h-7 w-7 place-items-center rounded-full bg-surface text-muted-foreground transition active:scale-90"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={pending !== null}
        title="Tambahkan teman ini?"
        description={
          <>
            Anda akan menambahkan <span className="font-semibold text-ink">{pending?.name}</span> (Kelas{" "}
            {pending?.className}) ke daftar jemput bersama. Pastikan Anda benar-benar berhak menjemput siswa ini.
          </>
        }
        confirmLabel="Ya, Tambahkan"
        cancelLabel="Batal"
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) onAdd(pending);
          setPending(null);
        }}
      />
    </div>
  );
}

