export function formatPlate(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const m = clean.match(/^([A-Z]{1,2})(\d{0,4})([A-Z]{0,3})$/);
  if (!m) return clean;
  return [m[1], m[2], m[3]].filter(Boolean).join(" ");
}

export function isValidPlate(raw: string): boolean {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return /^[A-Z]{1,2}\d{1,4}[A-Z]{1,3}$/.test(clean);
}

export function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
}

export function nowHHmm(now = new Date()): string {
  return `${String(now.getHours()).padStart(2, "0")}.${String(now.getMinutes()).padStart(2, "0")}`;
}

export function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "Baru saja";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  return `${Math.floor(h / 24)} hari lalu`;
}
