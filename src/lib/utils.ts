import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function formatIDR(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

// ─── Input Formatter & Parser ───────────────────────────────────────────────

export function formatRupiah(raw: string | number): string {
  if (typeof raw === "number") {
    return new Intl.NumberFormat("id-ID", {
      maximumFractionDigits: 0,
    }).format(Math.floor(raw));
  }
  const strValue = String(raw);
  const digits = strValue.replace(/\D/g, "");
  if (!digits) return "";
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(parseInt(digits));
}

export function parseCurrency(formatted: string | number): number {
  if (typeof formatted === "number") return formatted;
  return parseInt(String(formatted).replace(/\D/g, "") || "0");
}