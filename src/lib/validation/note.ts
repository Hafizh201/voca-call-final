export const MAX_NOTE = 100;

const BAD_WORDS = ["bodoh", "goblok", "tolol", "anjing", "bangsat", "kafir"];

export function detectBadWords(text: string): string[] {
  const lower = text.toLowerCase();
  return BAD_WORDS.filter((w) => lower.includes(w));
}

export function suggestionsFor(method: "self" | "other" | "ojek"): string[] {
  const base = [
    "Mohon segera menuju area penjemputan.",
    "Sudah menunggu di gerbang utama.",
    "Terima kasih atas bantuannya.",
  ];
  if (method === "other")
    return [
      "Penjemput adalah anggota keluarga terpercaya.",
      "Mohon konfirmasi identitas kepada petugas.",
      ...base,
    ];
  if (method === "ojek")
    return [
      "Driver menunggu di area parkir tamu.",
      "Mohon dipandu menuju kendaraan.",
      ...base,
    ];
  return base;
}

export function politeCorrection(text: string): string {
  if (!text.trim()) return text;
  const t = text
    .replace(/\bgw\b|\bgue\b|\baku\b/gi, "saya")
    .replace(/\blu\b|\blo\b|\bkamu\b/gi, "Bapak/Ibu")
    .replace(/\bgak\b|\bgk\b|\bnggak\b/gi, "tidak")
    .replace(/\butk\b/gi, "untuk")
    .replace(/\bdgn\b/gi, "dengan")
    .replace(/\byg\b/gi, "yang")
    .replace(/\bthx\b|\bmakasi\b/gi, "terima kasih")
    .trim();
  const cap = t.charAt(0).toUpperCase() + t.slice(1);
  return /[.!?]$/.test(cap) ? cap : cap + ".";
}
