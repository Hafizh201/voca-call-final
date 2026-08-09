import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useActiveCall } from "@/lib/call/stores";
import { useStudentsCache } from "@/lib/students";
import { PackageOpen, UserRoundCheck, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

/** Bar sticky di beranda untuk panggilan "ditunggu" / "titipan" → menuju /call/monitoring. */
export function StickyCallBar() {
  const { current } = useActiveCall();
  const students = useStudentsCache();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!current || current.done) return null;

  const isTitipan = current.type === "titipan";
  const called = students.filter((s) => current.studentIds.includes(s.id));

  return (
    <div
      className={cn(
        "sticky top-2 z-40 mx-3 mt-3 animate-fade-in rounded-2xl p-3 text-white transition-all duration-500",
        scrolled
          ? "border border-white/25 bg-primary/70 shadow-elevated backdrop-blur-xl"
          : "border border-primary/20 bg-gradient-hero shadow-elevated",
      )}
    >
      <Link to="/call/monitoring" className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15 animate-pulse-ring">
          {isTitipan ? <PackageOpen className="h-5 w-5" /> : <UserRoundCheck className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold mb-[-4px]">
            {isTitipan ? "Titipan belum diambil" : "Ananda sedang ditunggu"}
          </p>
          {called.length > 0 && (
            <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-white/90">
              <GraduationCap className="h-3.5 w-3.5 shrink-0 text-white/70" />
              {called.map((s, i) => (
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
          <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-white/70">
            {isTitipan ? "Ketuk untuk pantau titipan" : "Ketuk untuk pantau panggilan"}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold">Lihat</span>
      </Link>
    </div>
  );
}
