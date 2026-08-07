import { MAX_PICKUP_TIME_WIB } from "@/lib/dummy/data";
import type { PickupRequest } from "@/lib/state/stores";

/**
 * Waktu Indonesia Barat (WIB) adalah UTC+7.
 * Fungsi-fungsi di bawah menghitung waktu WIB secara akurat dari epoch timestamp,
 * sehingga tidak terpengaruh zona waktu perangkat/sistem lokal.
 */

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Komponen waktu WIB saat ini (jam & menit). */
export function nowWIB(): { hours: number; minutes: number; timestamp: number } {
  const utc = Date.now();
  const wib = new Date(utc + WIB_OFFSET_MS);
  return {
    hours: wib.getUTCHours(),
    minutes: wib.getUTCMinutes(),
    timestamp: utc,
  };
}

/** Format "HH.mm" dalam WIB saat ini. */
export function nowWIBHHmm(): string {
  const { hours, minutes } = nowWIB();
  return `${String(hours).padStart(2, "0")}.${String(minutes).padStart(2, "0")}`;
}

/** Parse "HH.mm" menjadi { hours, minutes }. */
export function parseHHmm(value: string): { hours: number; minutes: number } {
  const [h, m] = value.split(".").map((n) => parseInt(n || "0", 10));
  return { hours: isNaN(h) ? 0 : h, minutes: isNaN(m) ? 0 : m };
}

/**
 * True jika waktu WIB saat ini sudah sama atau melewati batas waktu maksimal.
 * 100% akurat berdasarkan UTC+7.
 */
export function isPastMaxPickupTime(maxTimeWIB = MAX_PICKUP_TIME_WIB): boolean {
  const now = nowWIB();
  const limit = parseHHmm(maxTimeWIB);
  const nowTotal = now.hours * 60 + now.minutes;
  const limitTotal = limit.hours * 60 + limit.minutes;
  return nowTotal >= limitTotal;
}

/**
 * True jika sebuah pemanggilan (PickupRequest) masih aktif dan sudah melewati
 * batas waktu maksimal WIB -> harus dihentikan paksa.
 */
export function shouldForceStopPickup(req: PickupRequest | null, maxTimeWIB = MAX_PICKUP_TIME_WIB): boolean {
  if (!req) return false;
  return isPastMaxPickupTime(maxTimeWIB);
}
