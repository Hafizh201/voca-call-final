import {
  MAX_PICKUP_TIME_WIB,
  PICKUP_ENABLED,
  PICKUP_FORCE_ON,
} from "@/lib/dummy/data";
import { isHoliday } from "@/lib/pickup/schedule";
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

/** Alasan pemanggilan terblokir. `null` = tersedia. */
export type PickupBlockKind = "off" | "past-time";

/**
 * ALASAN pemanggilan penjemputan diblokir, menyatukan semua aturan:
 *  1. Master `PICKUP_ENABLED` OFF → `"off"` (kunci segalanya; berlaku kapan pun).
 *  2. Hari libur (Sabtu–Minggu) → tersedia 24 jam (TIDAK terblokir) selama master ON.
 *  3. Hari sekolah (Senin–Jumat) lewat `MAX_PICKUP_TIME_WIB` → `"past-time"`, KECUALI
 *     `PICKUP_FORCE_ON` ON → tetap boleh.
 *
 * Return `null` bila pemanggilan tersedia.
 */
export function pickupBlockReason(now = new Date()): PickupBlockKind | null {
  // 1) Kunci utama: master off menghalangi segalanya.
  if (!PICKUP_ENABLED) return "off";

  // 2) Akhir pekan/libur buka 24 jam — tak pernah terblokir waktu (cukup master ON).
  if (isHoliday(now)) return null;

  // 3) Hari sekolah: lewat jam tutup → blokir, kecuali force_on.
  if (isPastMaxPickupTime()) {
    return PICKUP_FORCE_ON ? null : "past-time";
  }

  return null;
}

/** True jika pemanggilan saat ini tersedia (master on + aturan jam/days). */
export function isPickupAvailable(now = new Date()): boolean {
  return pickupBlockReason(now) === null;
}

/**
 * True jika waktu WIB saat ini sudah sama atau melewati jam kepulangan siswa.
 * `dismissalTime` berformat "HH.mm" (mis. "14.00"). Jika tidak ada nilai,
 * anggap sudah lewat (true) agar tidak menghalangi pemanggilan.
 */
export function isPastDismissalTime(dismissalTime?: string | null): boolean {
  if (!dismissalTime) return true;
  const now = nowWIB();
  const limit = parseHHmm(dismissalTime);
  const nowTotal = now.hours * 60 + now.minutes;
  const limitTotal = limit.hours * 60 + limit.minutes;
  return nowTotal >= limitTotal;
}
