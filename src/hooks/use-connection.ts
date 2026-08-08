import { useEffect, useState } from "react";

/**
 * Deteksi koneksi internet secara real.
 * Menggabungkan `navigator.onLine` (online/offline event) dengan periodic
 * ping ke sumber tepercaya guna memastikan internet benar-benar aktif
 * (bukan hanya wifi tersambung ke router tanpa internet).
 */
const PING_URL = "https://1.1.1.1"; // cepat, uptime tinggi, CORS ringan
const PING_INTERVAL = 15000; // 15 detik
const PING_TIMEOUT = 5000;

function supportsBeaconFetch(): boolean {
  return typeof fetch !== "undefined";
}

async function pingOnce(): Promise<boolean> {
  if (!supportsBeaconFetch()) return typeof navigator !== "undefined" ? navigator.onLine : true;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), PING_TIMEOUT);
    // GET dengan mode "no-cors" → kita hanya butuh indikasi bahwa jaringan tersedia.
    await fetch(PING_URL, { method: "HEAD", cache: "no-store", signal: ctrl.signal, mode: "no-cors" });
    clearTimeout(timer);
    return true;
  } catch {
    return false;
  }
}

export function useConnection(): boolean {
  const [online, setOnline] = useState<boolean>(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    let cancelled = false;

    const setOnlineIfChanged = (v: boolean) => {
      if (!cancelled) setOnline(v);
    };

    const onOnline = () => setOnlineIfChanged(true);
    const onOffline = () => setOnlineIfChanged(false);

    // Proactive ping loop (mendeteksi wifi "numpang" tanpa internet).
    const start = async () => {
      const ok = await pingOnce();
      setOnlineIfChanged(ok);
    };
    const id = window.setInterval(() => void start(), PING_INTERVAL);

    if (typeof navigator !== "undefined") {
      window.addEventListener("online", onOnline);
      window.addEventListener("offline", onOffline);
      setOnlineIfChanged(navigator.onLine);
      void start();
    }

    return () => {
      cancelled = true;
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.clearInterval(id);
    };
  }, []);

  return online;
}
