import { useEffect, useRef } from "react";
import { useActivePickup } from "@/lib/state/stores";
import { shouldForceStopPickup, nowWIBHHmm } from "@/lib/pickup/callDeadline";
import { forceStopActivePickup } from "@/lib/pickup/simulator";
import { notify } from "@/lib/state/notificationStore";
import { MAX_PICKUP_TIME_WIB } from "@/lib/dummy/data";

/**
 * Watcher global yang memantau batas waktu maksimal pemanggilan (WIB / UTC+7).
 * Berjalan setiap detik untuk akurasi tinggi. Jika jam sudah mencapai batas
 * (default 18.00 WIB) dan masih ada pemanggilan aktif yang belum selesai,
 * pemanggilan dihentikan paksa + muncul notifikasi.
 */
export function CallDeadlineWatcher() {
  const { current } = useActivePickup();
  const firedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!current) {
      firedRef.current = null;
      return;
    }
    // Hindari memicu berulang untuk pemanggilan yang sama.
    if (firedRef.current === current.id) return;

    const interval = setInterval(() => {
      if (shouldForceStopPickup(current, MAX_PICKUP_TIME_WIB)) {
        clearInterval(interval);
        firedRef.current = current.id;
        forceStopActivePickup();
        const at = nowWIBHHmm();
        notify(
          "Pemanggilan terpaksa dihentikan",
          `Waktu maksimal pemanggilan (${MAX_PICKUP_TIME_WIB} WIB) telah tercapai sehingga pemanggilan dihentikan otomatis pada ${at} WIB.`,
          "error",
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [current]);

  return null;
}
