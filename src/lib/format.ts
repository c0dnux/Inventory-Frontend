import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { brand } from "../config/branding";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value?: number | null) {
  return new Intl.NumberFormat(brand.locale, {
    style: "currency",
    currency: brand.currency,
    maximumFractionDigits: 2,
  }).format(value ?? 0);
}

export function formatNumber(value?: number | null) {
  return new Intl.NumberFormat(brand.locale).format(value ?? 0);
}

const OUTGOING_MOVEMENT_TYPES = new Set(["stock_out", "adjustment_out"]);

export function isOutgoingMovement(type?: string) {
  return OUTGOING_MOVEMENT_TYPES.has(type ?? "");
}

export function formatDate(value?: string | number | Date | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(brand.locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value?: string | number | Date | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(brand.locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function timeAgo(value?: string | number | Date | null) {
  if (!value) return "";
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  const intervals: Array<[number, string]> = [
    [31536000, "year"],
    [2592000, "month"],
    [604800, "week"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
  ];
  for (const [secondsPer, label] of intervals) {
    const count = Math.floor(seconds / secondsPer);
    if (count >= 1) {
      return `${count} ${label}${count === 1 ? "" : "s"} ago`;
    }
  }
  return "just now";
}
