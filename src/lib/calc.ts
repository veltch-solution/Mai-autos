import type { Invoice, InvoiceStatus } from "./types";

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const num = (v: unknown) => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
};

export interface Totals {
  subtotal: number;
  discount: number;
  vat: number;
  total: number;
  amountPaid: number;
  balance: number;
  status: InvoiceStatus;
}

export function lineAmount(qty: unknown, unitPrice: unknown): number {
  return round2(num(qty) * num(unitPrice));
}

export function computeTotals(
  inv: Pick<Invoice, "items" | "discount" | "vatRate" | "amountPaid">
): Totals {
  const subtotal = round2(
    inv.items.reduce((s, it) => s + lineAmount(it.qty, it.unitPrice), 0)
  );
  const discount = round2(Math.min(Math.max(num(inv.discount), 0), subtotal));
  const taxable = subtotal - discount;
  const vat = round2(taxable * (num(inv.vatRate) / 100));
  const total = round2(taxable + vat);
  const amountPaid = round2(num(inv.amountPaid));
  const balance = round2(total - amountPaid);
  const status: InvoiceStatus =
    total > 0 && balance <= 0.005 ? "paid" : amountPaid > 0 ? "partial" : "unpaid";
  return { subtotal, discount, vat, total, amountPaid, balance, status };
}

export function statusOf(total: number, balance: number): InvoiceStatus {
  if (total > 0 && balance <= 0.005) return "paid";
  if (balance < total) return "partial";
  return "unpaid";
}

export function vehicleLabel(v: { year: string; make: string; model: string }): string {
  return [v.year, v.make, v.model].map((s) => (s || "").trim()).filter(Boolean).join(" ");
}
