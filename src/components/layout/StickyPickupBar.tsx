import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useActivePickup, useStudentStatus, STAGE_LABELS } from "@/lib/state/stores";
import { students } from "@/lib/dummy/data";
import { Radio, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

export function StickyPickupBar() {
  const { current } = useActivePickup();
  const studentStatus = useStudentStatus();
  const [, setTick] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  // Tick agar info call count tetap real-time.
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Deteksi scroll: saat di posisi atas -> solid biru tua; saat discroll -> glass dengan tint biru tua.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!current) return null;

  // Gunakan label dari STAGE_LABELS agar selalu mengikuti status terkini (tidak dari timeline yang tersimpan).
  const statusLabel = STAGE_LABELS[current.stage] ?? "Sedang dipanggil";

  // Semua siswa yang sedang dipanggil (real-time dari store).
  const calledStudents = students.filter((s) => current.studentIds.includes(s.id));
  const firstStudentId = current.studentIds[0];
  const callCount = studentStatus[firstStudentId]?.callCount ?? current.callCount;

  return (
    <div
      className={cn(
        "sticky top-2 z-40 mx-3 mt-3 animate-fade-in rounded-2xl p-3 text-white transition-all duration-500",
        scrolled
          ? "border border-white/25 bg-primary/70 shadow-elevated backdrop-blur-xl"
          : "border border-primary/20 bg-gradient-hero shadow-elevated",
      )}
    >
      <Link to="/monitoring" className="flex items-center gap-3">
        <div
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-xl animate-pulse-ring",
            scrolled ? "bg-white/20 text-white" : "bg-white/15 text-white",
          )}
        >
          <Radio className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
<p className="truncate text-lg font-bold mb-[-4px]">{statusLabel}</p>

{/* Baris siswa & kelas yang sedang dipanggil (semua, gabung 1 baris, dipisah "•") */}
          {calledStudents.length > 0 && (
            <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-white/90">
              <GraduationCap className="h-3.5 w-3.5 shrink-0 text-white/70" />
              {calledStudents.map((s, i) => (
                <span key={s.id} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-white/60">•</span>}
                  <span className="text-[11px] font-semibold">{s.nickname}</span>
                  <span className="shrink-0 rounded-full bg-white/20 px-1.5 py-px text-[9px] font-bold pt-[4px]">
                    {s.className}
                  </span>
                </span>
              ))}
            </p>
          )}

          <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-white/70 ">
            Sudah dipanggil {callCount}&times;
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold">Lihat</span>
      </Link>
    </div>
  );
}
