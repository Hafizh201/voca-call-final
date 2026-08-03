import { PhoneShell } from "@/components/layout/PhoneShell";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageSkeleton } from "@/components/feedback/Skeletons";
import { usePageReady } from "@/hooks/use-page-ready";
import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

export function PlaceholderPage({
  title,
  subtitle,
  body,
  icon,
  back = "/dashboard",
  children,
  hideNav = false,
}: {
  title: string;
  subtitle?: string;
  body?: string;
  icon?: ReactNode;
  back?: string;
  children?: ReactNode;
  hideNav?: boolean;
}) {
  const ready = usePageReady();
  if (!ready) return <PageSkeleton withNav={!hideNav} />;
  return (
    <PhoneShell>
      <TopBar title={title} subtitle={subtitle} back={back} />
      <div className="p-5">
        {children ?? (
          <EmptyState
            icon={icon ?? <Sparkles className="h-6 w-6" />}
            title="Segera hadir"
            body={body ?? "Halaman ini sedang disiapkan. Fitur akan aktif di iterasi berikutnya."}
          />
        )}
      </div>
      {!hideNav && <BottomNav />}
    </PhoneShell>
  );
}
