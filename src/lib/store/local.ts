/**
 * Demo-mode store: keeps everything in the browser's localStorage.
 * Used automatically when Supabase environment variables are not set.
 */
import { computeTotals, vehicleLabel } from "../calc";
import { withDefaults } from "../defaults";
import type { Invoice, InvoiceSummary, Settings } from "../types";
import type { InvoiceStore } from "./types";

const K_INVOICES = "mai-autos:invoices";
const K_SETTINGS = "mai-autos:settings";

function readAll(): Invoice[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(K_INVOICES);
    return raw ? (JSON.parse(raw) as Invoice[]) : [];
  } catch {
    return [];
  }
}

function writeAll(list: Invoice[]) {
  window.localStorage.setItem(K_INVOICES, JSON.stringify(list));
}

export const localStore: InvoiceStore = {
  kind: "local",

  async list() {
    return readAll()
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
      .map<InvoiceSummary>((inv) => {
        const t = computeTotals(inv);
        return {
          id: inv.id,
          number: inv.number,
          issueDate: inv.issueDate,
          customerName: inv.customer.name,
          vehicle: vehicleLabel(inv.vehicle),
          currency: inv.currency,
          total: t.total,
          balance: t.balance,
          updatedAt: inv.updatedAt,
        };
      });
  },

  async get(id) {
    return readAll().find((i) => i.id === id) ?? null;
  },

  async save(invoice) {
    const list = readAll();
    const next = { ...invoice, updatedAt: new Date().toISOString() };
    const idx = list.findIndex((i) => i.id === invoice.id);
    if (idx >= 0) list[idx] = next;
    else list.push(next);
    writeAll(list);
    return next;
  },

  async remove(id) {
    writeAll(readAll().filter((i) => i.id !== id));
  },

  async getSettings() {
    if (typeof window === "undefined") return withDefaults(null);
    try {
      const raw = window.localStorage.getItem(K_SETTINGS);
      return withDefaults(raw ? (JSON.parse(raw) as Partial<Settings>) : null);
    } catch {
      return withDefaults(null);
    }
  },

  async saveSettings(settings) {
    window.localStorage.setItem(K_SETTINGS, JSON.stringify(settings));
  },
};
