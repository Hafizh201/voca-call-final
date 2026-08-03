import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    if (typeof navigator !== "undefined") setOffline(!navigator.onLine);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  if (!offline) return null;
  return (
    <div className="mx-3 mt-3 flex items-center gap-2 rounded-2xl bg-warning/20 px-4 py-3 text-xs font-semibold text-warning-foreground">
      <WifiOff className="h-4 w-4" />
      Anda sedang offline. Beberapa fitur mungkin terbatas.
    </div>
  );
}
