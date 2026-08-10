import { useEffect, useRef, useState } from "react";
import { Video, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const CALL_TABLES = ["panggil_self", "panggil_other", "panggil_ojek", "panggil_ditunggu", "panggil_titipan"] as const;
type CallTable = (typeof CALL_TABLES)[number];

type CctvEvent = {
  key: string;
  kind: "call" | "recall";
  names: string;
  detail: string;
  time: string;
  at: number;
};

type CallRow = {
  id_pemanggilan: number | string;
  nama_siswa: string | null;
  method: string | null;
  waktu_pemanggilan: string | null;
};

function detailFor(table: CallTable, recall = false) {
  const label: Record<CallTable, string> = {
    panggil_self: "Dijemput sendiri",
    panggil_other: "Dijemput orang lain",
    panggil_ojek: "Dijemput ojek online",
    panggil_ditunggu: "Panggilan ditunggu",
    panggil_titipan: "Ambil titipan",
  };
  return recall ? `Panggilan ulang · ${label[table]}` : label[table];
}

function displayTime(value: string | null | undefined) {
  const date = value ? new Date(value) : new Date();
  return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function eventFromCall(table: CallTable, row: CallRow): CctvEvent {
  const at = row.waktu_pemanggilan ? new Date(row.waktu_pemanggilan).getTime() : Date.now();
  return {
    key: `${table}-${row.id_pemanggilan}`,
    kind: "call",
    names: row.nama_siswa?.trim() || "Nama siswa tidak tersedia",
    detail: detailFor(table),
    time: displayTime(row.waktu_pemanggilan),
    at,
  };
}

/** Feed pemanggilan untuk pengguna; hanya event berhasil dari database, bukan log developer. */
export function CctvPanel() {
  const [events, setEvents] = useState<CctvEvent[]>([]);
  const [open, setOpen] = useState(false);
  const dragStartY = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const addEvent = (event: CctvEvent) => {
    setEvents((current) => {
      if (current.some((item) => item.key === event.key)) return current;
      return [event, ...current].sort((a, b) => b.at - a.at).slice(0, 100);
    });
  };

  const resolveRecall = async (row: Record<string, unknown>) => {
    const id = Number(row.id_pemanggilan);
    if (!Number.isFinite(id)) return;
    const results = await Promise.all(
      CALL_TABLES.map(async (table) => {
        const { data } = await supabase
          .from(table)
          .select("id_pemanggilan, nama_siswa, method, waktu_pemanggilan")
          .eq("id_pemanggilan", id)
          .maybeSingle();
        return data ? { table, row: data as CallRow } : null;
      }),
    );
    const source = results.find((result): result is { table: CallTable; row: CallRow } => result !== null);
    if (!source) return;

    const recallTime = typeof row.waktu_pemanggilan === "string" ? row.waktu_pemanggilan : null;
    const recallNumber = Number(row.pemanggilan_ke) || 2;
    addEvent({
      key: `recall-${id}-${recallNumber}`,
      kind: "recall",
      names: source.row.nama_siswa?.trim() || "Nama siswa tidak tersedia",
      detail: `${detailFor(source.table, true)} ke-${recallNumber}`,
      time: displayTime(recallTime),
      at: recallTime ? new Date(recallTime).getTime() : Date.now(),
    });
  };

  useEffect(() => {
    let active = true;
    const addIfActive = (event: CctvEvent) => active && addEvent(event);

    void Promise.all(
      CALL_TABLES.map(async (table) => {
        const { data } = await supabase
          .from(table)
          .select("id_pemanggilan, nama_siswa, method, waktu_pemanggilan")
          .order("waktu_pemanggilan", { ascending: false })
          .limit(20);
        for (const row of (data ?? []) as CallRow[]) addIfActive(eventFromCall(table, row));
      }),
    );
    void supabase
      .from("recall")
      .select("id_pemanggilan, pemanggilan_ke, waktu_pemanggilan")
      .order("waktu_pemanggilan", { ascending: false })
      .limit(20)
      .then(({ data }) => Promise.all((data ?? []).map((row) => active && resolveRecall(row as Record<string, unknown>))));

    const channel = supabase.channel("cctv-user-call-feed");
    for (const table of CALL_TABLES) {
      channel.on("postgres_changes", { event: "INSERT", schema: "public", table }, (payload) => {
        addIfActive(eventFromCall(table, payload.new as CallRow));
      });
    }
    channel
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "recall" }, (payload) => {
        void resolveRecall(payload.new as Record<string, unknown>);
      })
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  const close = () => {
    setIsDragging(false);
    setDragOffset(0);
    setOpen(false);
  };

  const feed = events.flatMap((event, index) => {
    const day = new Date(event.at).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const previous = events[index - 1];
    const previousDay = previous
      ? new Date(previous.at).toLocaleDateString("id-ID", { day: "numeric", month: "numeric", year: "numeric" })
      : null;
    const currentDay = new Date(event.at).toLocaleDateString("id-ID", { day: "numeric", month: "numeric", year: "numeric" });
    return [
      ...(previousDay === currentDay ? [] : [{ type: "day" as const, key: `day-${currentDay}`, label: day }]),
      { type: "event" as const, key: event.key, event },
    ];
  });

  const onDragStart = (event: React.PointerEvent<HTMLDivElement>) => {
    dragStartY.current = event.clientY;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onDragMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartY.current === null) return;
    setDragOffset(Math.max(0, event.clientY - dragStartY.current));
  };

  const onDragEnd = () => {
    if (dragStartY.current === null) return;
    const shouldClose = dragOffset > 88;
    dragStartY.current = null;
    setIsDragging(false);
    if (shouldClose) close();
    else setDragOffset(0);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Buka CCTV pemantau"
        className={cn(
          "fixed bottom-24 right-4 z-[60] grid h-11 w-11 place-items-center rounded-2xl shadow-card transition active:scale-95",
          open ? "bg-primary text-primary-foreground" : "border border-border bg-surface text-primary",
        )}
      >
        <Video className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/40 p-3 backdrop-blur-sm" onClick={close}>
          <div className="w-full max-w-[480px] animate-[slide-up_650ms_cubic-bezier(0.22,1,0.36,1)_both]">
            <div
              role="dialog"
              aria-modal="true"
              aria-label="CCTV pemantau pemanggilan"
              onClick={(event) => event.stopPropagation()}
              style={{ transform: `translateY(${dragOffset}px)` }}
              className={cn(
                "flex h-[70vh] w-full flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-elevated",
                isDragging
                  ? "transition-none"
                  : "transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
              )}
            >
            <div
              onPointerDown={onDragStart}
              onPointerMove={onDragMove}
              onPointerUp={onDragEnd}
              onPointerCancel={onDragEnd}
              className="touch-none border-b border-border/70 bg-surface-2/70 px-4 pb-3 pt-2"
            >
              <div className="mx-auto mb-2.5 h-1.5 w-12 rounded-full bg-ink/20 shadow-inner" aria-hidden="true" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary"><Video className="h-4 w-4" /></span>
                  <div>
                    <p className="font-display text-sm font-bold text-ink">CCTV Pemantau</p>
                    <p className="font-mono text-[10px] text-muted-foreground">// aktivitas pemanggilan sekolah</p>
                  </div>
                </div>
                <button type="button" onClick={close} aria-label="Tutup" className="grid h-8 w-8 place-items-center rounded-xl bg-surface text-muted-foreground active:scale-95"><X className="h-4 w-4" /></button>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-border/60 px-4 py-2">
              <span className="font-mono text-[10px] font-bold text-muted-foreground">{events.length} aktivitas tercatat</span>
              <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-success"><span className="h-2 w-2 animate-pulse rounded-full bg-success" />LIVE</span>
            </div>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
              {events.length === 0 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">Belum ada pemanggilan terbaru.</p>
              ) : (
                feed.map((item) =>
                  item.type === "day" ? (
                    <div key={item.key} className="flex items-center gap-2 py-2 font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                      <span className="h-px flex-1 bg-border/70" />
                      <span>// {item.label}</span>
                      <span className="h-px flex-1 bg-border/70" />
                    </div>
                  ) : (
                    <div key={item.key} className="rounded-2xl border border-border/80 bg-surface-2/50 p-3 font-mono transition hover:border-primary/30 hover:bg-primary/[0.03]">
                      <div className="flex items-start gap-2.5">
                        <span className="mt-0.5 text-primary">›</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={cn("rounded-md px-1.5 py-0.5 text-[9px] font-black tracking-wide", item.event.kind === "recall" ? "bg-warning/15 text-warning-foreground" : "bg-success/15 text-success-foreground")}>
                              {item.event.kind === "recall" ? "RECALL" : "PANGGIL"}
                            </span>
                            <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">{item.event.time}</span>
                          </div>
                          <p className="mt-2 truncate font-display text-sm font-bold text-ink">{item.event.names}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">{item.event.detail}</p>
                        </div>
                      </div>
                    </div>
                  ),
                )
              )}
            </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
