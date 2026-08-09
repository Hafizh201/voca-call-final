import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { usePageReady } from "@/hooks/use-page-ready";
import { DashboardSkeleton } from "@/components/feedback/Skeletons";
import { useEffect, useState } from "react";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { BottomNav } from "@/components/layout/BottomNav";
import { StickyPickupBar } from "@/components/layout/StickyPickupBar";
import { OfflineBanner } from "@/components/feedback/OfflineBanner";
import { StudentHeroCard } from "@/components/cards/StudentHeroCard";
import { AnnouncementList, TipsCard, RecentPickupsCard, SystemStatusCard } from "@/components/cards/DashboardCards";
import { SectionHeader, Chip } from "@/components/common/Section";
import { BigButton } from "@/components/common/BigButton";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { contacts } from "@/lib/dummy/data";
import { useSession, useActivePickup } from "@/lib/state/stores";
import { useStudents } from "@/lib/students";
import { greeting } from "@/lib/format/utils";
import { PhoneCall, History, Megaphone, Wifi, WifiOff, LifeBuoy, Clock, Phone, PackageOpen, UserRoundCheck } from "lucide-react";
import { useConnection } from "@/hooks/use-connection";
import { pickupBlockReason } from "@/lib/pickup/callDeadline";
import { MAX_PICKUP_TIME_WIB } from "@/lib/dummy/data";
import { AutoPickupGeofence } from "@/components/monitoring/AutoPickupGeofence";
import { NotificationsFloating } from "@/components/notifications/NotificationsFloating";
import { CctvPanel } from "@/components/common/CctvPanel";
import { useActiveCall, completeCall } from "@/lib/call/stores";
import { useStudents as useStudentsForCall } from "@/lib/students";


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
const { students } = useStudents();
const active = students.filter((s) => s && s.name?.trim() && !s.pendingApproval);
  const pickupBlock = pickupBlockReason();
  const pickupClosed = pickupBlock !== null;
  const [closedAsk, setClosedAsk] = useState(false);
  const csContact = contacts.find((c) => c.role === "Admin Penjemputan") ?? contacts[0];
  const online = useConnection();
  const todayDismissal = active[0]?.dismissalTime;

  useEffect(() => {
    if (!session.signedIn) nav({ to: "/login" });
  }, [session.signedIn, nav]);

  return (
    <PhoneShell>
      <div className="flex items-center justify-between px-5 pt-6">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted-foreground">Assalamu’alaikum, {greeting()}</p>
<h1 className="truncate font-display text-2xl font-bold text-ink">{session.statusUser ? `${session.statusUser} ${session.namaWalmur ?? session.username}` : (session.namaWalmur ?? session.username)}</h1>
        </div>
<div className="flex items-center gap-2">
          {online ? (
            <Chip tone="success"><Wifi className="h-3 w-3" /> Terhubung</Chip>
          ) : (
            <Chip tone="danger"><WifiOff className="h-3 w-3" /> Terputus</Chip>
          )}
          <NotificationsFloating />
        </div>

      </div>

<OfflineBanner />
      <StickyPickupBar />

{active.length > 0 && (
        <div className="mt-5">
          <StudentHeroCard students={active} />
        </div>
      )}
      <AutoPickupGeofence />
<div className="mx-5 mt-4 grid grid-cols-2 gap-3">
<QuickAction
          to="/pickup/method"
          icon={pickupClosed ? <Clock className="h-5 w-5" /> : <PhoneCall className="h-5 w-5" />}
          title="Mulai Jemput"
          body={
            pickupBlock === "off"
              ? "Pemanggilan nonaktif"
              : pickupBlock === "past-time"
                ? `Ditutup ${MAX_PICKUP_TIME_WIB} WIB`
                : current
                  ? "Lanjutkan proses"
                  : todayDismissal
                    ? `Pulang ${todayDismissal}`
                    : "Siap menjemput"
          }
          highlight
          onClick={() => {
            if (pickupClosed) {
              setClosedAsk(true);
              return;
            }
            nav({ to: "/pickup/method" });
          }}
        />
<QuickAction to="/history" icon={<History className="h-5 w-5" />} title="Riwayat" body="Cek pemanggilan lalu" />
        <QuickAction to="/call/method" icon={<Megaphone className="h-5 w-5" />} title="Panggil" body="Titipan atau ditunggu" />
<QuickAction to="/help" icon={<LifeBuoy className="h-5 w-5" />} title="Bantuan" body="Panduan & kontak" />
      </div>

      <CallStatusCard />
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
      <CctvPanel />

      <ConfirmDialog
        open={closedAsk}
        title={pickupBlock === "off" ? "Pemanggilan sedang nonaktif" : "Pemanggilan sudah ditutup"}
        description={
          pickupBlock === "off"
            ? "Layanan pemanggilan penjemputan sedang dinonaktifkan oleh pihak sekolah untuk sementara waktu. Anda tidak dapat memulai penjemputan saat ini. Silakan hubungi Admin Penjemputan jika memerlukan bantuan."
            : `Layanan pemanggilan penjemputan telah berakhir pada pukul ${MAX_PICKUP_TIME_WIB} WIB. Anda tidak dapat memulai penjemputan saat ini. Silakan hubungi Admin Penjemputan jika memerlukan bantuan.`
        }
        cancelLabel="Kembali"
        confirmLabel="Hubungi CS"
        onCancel={() => setClosedAsk(false)}
        onConfirm={() => {
          setClosedAsk(false);
          window.location.href = `tel:${csContact?.phone ?? ""}`;
        }}
      />
    </PhoneShell>
  );
}

function QuickAction({
  to,
  icon,
  title,
  body,
  highlight,
  onClick,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  highlight?: boolean;
  onClick?: () => void;
}) {
  const base = "flex flex-col gap-3 rounded-3xl p-4 shadow-card transition active:scale-[0.98] " +
    (highlight ? "bg-gradient-hero text-primary-foreground" : "bg-surface text-foreground border border-border/60");
  const inner = (
    <>
      <span className={"grid h-10 w-10 place-items-center rounded-2xl " + (highlight ? "bg-white/15" : "bg-primary/10 text-primary")}>
        {icon}
      </span>
      <div>
        <p className="font-display text-sm font-bold">{title}</p>
        <p className={"text-[11px] " + (highlight ? "text-white/75" : "text-muted-foreground")}>{body}</p>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={base + " text-left"}>
        {inner}
      </button>
    );
  }

return (
    <Link to={to} className={base}>
      {inner}
    </Link>
  );
}

function CallStatusCard() {
  const { current } = useActiveCall();
  const { students } = useStudentsForCall();
  const nav = useNavigate();

  if (!current || current.done) return null;

  const names = current.studentIds
    .map((id) => students.find((s) => s.id === id)?.name)
    .filter(Boolean)
    .join(", ");

const isTitipan = current.type === "titipan";
  const detail = isTitipan ? `Titipan untuk ${names}` : `${names} ditunggu menunggumu`;

  return (
    <div className="mx-5 mt-4">
      <div className="flex items-start gap-3 rounded-3xl border border-border bg-surface p-4 shadow-card">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          {isTitipan ? <PackageOpen className="h-5 w-5" /> : <UserRoundCheck className="h-5 w-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-bold text-ink">
            {isTitipan ? "Panggilan Titipan Aktif" : "Panggilan Ditunggu Aktif"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => nav({ to: "/monitoring" })}
              className="rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground shadow-card active:scale-95"
            >
              Lihat Status
            </button>
            <button
              type="button"
              onClick={() => completeCall(current.id)}
              className="rounded-full border border-border px-3 py-1.5 text-[11px] font-bold text-muted-foreground active:scale-95"
            >
              {isTitipan ? "Sudah diambil" : "Selesai"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
