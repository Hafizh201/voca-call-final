import { PhoneShell } from "@/components/layout/PhoneShell";
import { cn } from "@/lib/utils";

export function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-surface-2",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent",
        "before:animate-[shimmer_1.4s_infinite]",
        className,
      )}
    />
  );
}

/**
 * Penanda loading di dalam halaman, bukan splash screen. Skeleton tetap
 * terlihat di belakang agar pengguna tahu halaman mana yang sedang disiapkan.
 */
function PanggilLoadingCue() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-20 z-10 flex justify-center px-5" role="status" aria-live="polite">
      <div className="flex items-center gap-3 rounded-2xl border border-primary/10 bg-background/85 px-3 py-2 shadow-card backdrop-blur-sm">
        <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-primary text-sm font-display font-extrabold text-primary-foreground">
          P
          <span className="absolute inset-y-1 left-0 w-1/2 bg-white/20 panggil-loading-scan" />
        </span>
        <span>
          <span className="block font-display text-xs font-bold text-ink">Panggil</span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            Menyiapkan data
            <i className="panggil-loading-dot" />
            <i className="panggil-loading-dot [animation-delay:140ms]" />
            <i className="panggil-loading-dot [animation-delay:280ms]" />
          </span>
        </span>
      </div>
    </div>
  );
}

function TopBarSkeleton({ withBack = false }: { withBack?: boolean }) {
  return (
    <div className="flex items-center gap-3 px-5 pt-6">
      {withBack && <Shimmer className="h-10 w-10 rounded-2xl" />}
      <div className="min-w-0 flex-1 space-y-2">
        <Shimmer className="h-3 w-24 rounded-full" />
        <Shimmer className="h-6 w-40 rounded-full" />
      </div>
      <Shimmer className="h-10 w-10 rounded-2xl" />
    </div>
  );
}

function BottomNavSkeleton() {
  return (
    <div className="fixed inset-x-0 bottom-0 mx-auto flex max-w-[480px] items-center justify-around border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5">
          <Shimmer className="h-6 w-6 rounded-xl" />
          <Shimmer className="h-2 w-8 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <PhoneShell>
      <PanggilLoadingCue />
      <TopBarSkeleton />
      <div className="mx-5 mt-5">
        <Shimmer className="h-56 rounded-3xl" />
      </div>
      <div className="mx-5 mt-4 grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Shimmer key={i} className="h-28 rounded-3xl" />
        ))}
      </div>
      <div className="mx-5 mt-8 space-y-3">
        <Shimmer className="h-4 w-32 rounded-full" />
        <Shimmer className="h-20 rounded-3xl" />
      </div>
      <div className="mx-5 mt-6 space-y-3">
        <Shimmer className="h-4 w-40 rounded-full" />
        <Shimmer className="h-24 rounded-3xl" />
        <Shimmer className="h-24 rounded-3xl" />
      </div>
      <BottomNavSkeleton />
    </PhoneShell>
  );
}

export function PageSkeleton({
  withBack = true,
  withNav = true,
  rows = 4,
}: {
  withBack?: boolean;
  withNav?: boolean;
  rows?: number;
}) {
  return (
    <PhoneShell>
      <PanggilLoadingCue />
      <TopBarSkeleton withBack={withBack} />
      <div className="mx-5 mt-6 space-y-3">
        <Shimmer className="h-32 rounded-3xl" />
        {Array.from({ length: rows }).map((_, i) => (
          <Shimmer key={i} className="h-16 rounded-2xl" />
        ))}
      </div>
      {withNav && <BottomNavSkeleton />}
    </PhoneShell>
  );
}

export function FormSkeleton() {
  return (
    <PhoneShell>
      <PanggilLoadingCue />
      <TopBarSkeleton withBack />
      <div className="mx-5 mt-6 space-y-4">
        <Shimmer className="h-24 rounded-3xl" />
        <div className="space-y-2">
          <Shimmer className="h-3 w-24 rounded-full" />
          <Shimmer className="h-14 rounded-2xl" />
        </div>
        <div className="space-y-2">
          <Shimmer className="h-3 w-20 rounded-full" />
          <Shimmer className="h-14 rounded-2xl" />
        </div>
        <div className="space-y-2">
          <Shimmer className="h-3 w-28 rounded-full" />
          <Shimmer className="h-28 rounded-2xl" />
        </div>
        <Shimmer className="mt-4 h-14 rounded-3xl" />
      </div>
    </PhoneShell>
  );
}

export function MonitoringSkeleton() {
  return (
    <PhoneShell>
      <PanggilLoadingCue />
      <TopBarSkeleton withBack />
      <div className="mt-8 flex flex-col items-center gap-4">
        <Shimmer className="h-48 w-48 rounded-full" />
        <Shimmer className="h-4 w-40 rounded-full" />
        <Shimmer className="h-3 w-24 rounded-full" />
      </div>
      <div className="mx-5 mt-8 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Shimmer key={i} className="h-14 rounded-2xl" />
        ))}
      </div>
    </PhoneShell>
  );
}
