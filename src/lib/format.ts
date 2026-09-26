import { CURRENCIES, type Currency } from "./types";

export function currencySymbol(c: Currency): string {
  return CURRENCIES.find((x) => x.code === c)?.symbol ?? c + " ";
}

export function formatMoney(amount: number, currency: Currency): string {
  const n = Number.isFinite(amount) ? amount : 0;
  const body = Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${n < 0 ? "-" : ""}${currencySymbol(currency)}${body}`;
}

/** YYYY-MM-DD -> DD/MM/YYYY */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

/** Today's date as YYYY-MM-DD in the user's local timezone */
export function todayISO(): string {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

export function pad(n: number, width = 3): string {
  return String(n).padStart(width, "0");
}
