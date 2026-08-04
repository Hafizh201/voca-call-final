import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { usePageReady } from "@/hooks/use-page-ready";
import { DashboardSkeleton } from "@/components/feedback/Skeletons";
import { useEffect } from "react";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { BottomNav } from "@/components/layout/BottomNav";
import { StickyPickupBar } from "@/components/layout/StickyPickupBar";
import { OfflineBanner } from "@/components/feedback/OfflineBanner";
import { StudentHeroCard } from "@/components/cards/StudentHeroCard";
import { AnnouncementList, TipsCard, RecentPickupsCard, SystemStatusCard } from "@/components/cards/DashboardCards";
import { SectionHeader, Chip } from "@/components/common/Section";
import { BigButton } from "@/components/common/BigButton";
import { students, dismissalTime } from "@/lib/dummy/data";
import { useSession, useActivePickup } from "@/lib/state/stores";
import { greeting } from "@/lib/format/utils";
import { PhoneCall, History, ClipboardList, Wifi, Bell, LifeBuoy } from "lucide-react";
import { AutoPickupGeofence } from "@/components/monitoring/AutoPickupGeofence";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Beranda — Panggil" },
      { name: "description", content: "Pantau status siswa, jadwal pulang, dan mulai penjemputan dari beranda." },
      { property: "og:title", content: "Beranda — Panggil" },
      { property: "og:description", content: "Ringkasan aktivitas penjemputan hari ini." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const ready = usePageReady(700);

  if (!ready) return <DashboardSkeleton />;

  return <DashboardContent />;
}

function DashboardContent() {
  const session = useSession();
  const nav = useNavigate();
  const { current } = useActivePickup();
  const active = students.filter((s) => !s.pendingApproval);
  const primary = active[0];

  useEffect(() => {
    if (!session.signedIn) nav({ to: "/login" });
  }, [session.signedIn, nav]);

  return (
    <PhoneShell>
      <div className="flex items-center justify-between px-5 pt-6">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted-foreground">Assalamu’alaikum, {greeting()}</p>
          <h1 className="truncate font-display text-2xl font-bold text-ink">Wali Murid {primary?.nickname}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Chip tone="success"><Wifi className="h-3 w-3" /> Terhubung</Chip>
          <NotificationsFloating />
        </div>

      </div>

      <OfflineBanner />
      <StickyPickupBar />

      <div className="mt-5">
        <StudentHeroCard student={primary} />
      </div>
      <AutoPickupGeofence />
      <div className="mx-5 mt-4 grid grid-cols-2 gap-3">
        <QuickAction
          to="/pickup/method"
          icon={<PhoneCall className="h-5 w-5" />}
          title="Mulai Jemput"
          body={current ? "Lanjutkan proses" : `Pulang ${dismissalTime}`}
          highlight
        />
        <QuickAction to="/history" icon={<History className="h-5 w-5" />} title="Riwayat" body="Cek pemanggilan lalu" />
        <QuickAction to="/attendance-today" icon={<ClipboardList className="h-5 w-5" />} title="Presensi Hari Ini" body="Anak Anda" />
        <QuickAction to="/help" icon={<LifeBuoy className="h-5 w-5" />} title="Bantuan" body="Panduan & kontak" />
      </div>
{/*
      <div className="mt-8">
        <SectionHeader title="Status Sistem" />
        <SystemStatusCard />
      </div>
*/}
      <div className="mt-8">
        <SectionHeader title="Pengumuman Sekolah" action={<Link to="/school" className="text-xs font-semibold text-primary">Semua</Link>} />
        <AnnouncementList />
      </div>
{/*
      <div className="mt-8">
        <SectionHeader title="Tips Penjemputan" />
        <TipsCard />
      </div>
*/}
      <div className="mt-8">
        <SectionHeader title="Penjemputan Terakhir" action={<Link to="/history" className="text-xs font-semibold text-primary">Lihat semua</Link>} />
        <RecentPickupsCard />
      </div>

      {/* <div className="mx-5 mt-8"> 
        <BigButton onClick={() => nav({ to: "/pickup/method" })}>Mulai Penjemputan</BigButton>
      </div> */}

      <BottomNav />
    </PhoneShell>
  );
}

function QuickAction({
  to,
  icon,
  title,
  body,
  highlight,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  highlight?: boolean;
}) {
  return (
    <Link
      to={to}
      className={
        "flex flex-col gap-3 rounded-3xl p-4 shadow-card transition active:scale-[0.98] " +
        (highlight ? "bg-gradient-hero text-primary-foreground" : "bg-surface text-foreground border border-border/60")
      }
    >
      <span className={"grid h-10 w-10 place-items-center rounded-2xl " + (highlight ? "bg-white/15" : "bg-primary/10 text-primary")}>
        {icon}
      </span>
      <div>
        <p className="font-display text-sm font-bold">{title}</p>
        <p className={"text-[11px] " + (highlight ? "text-white/75" : "text-muted-foreground")}>{body}</p>
      </div>
    </Link>
  );
}
