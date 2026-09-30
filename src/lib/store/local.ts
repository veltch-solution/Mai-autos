/**
 * Demo-mode store: keeps everything in the browser's localStorage.
 * Used automatically when Supabase environment variables are not set.
 */
import { computeTotals, vehicleLabel } from "../calc";
import { withDefaults } from "../defaults";
import type { Invoice, InvoiceSummary, Settings } from "../types";
import type { StockVehicle } from "../stock";
import type { DealRecord } from "../deals";
import type { CustomerRecord } from "../customers";
import type { ServiceRecord } from "../service";
import type { InvoiceStore } from "./types";

const K_INVOICES = "mai-autos:invoices";
const K_SETTINGS = "mai-autos:settings";
const K_VEHICLES = "mai-autos:vehicles";
const K_DEALS = "mai-autos:deals";
const K_CUSTOMERS = "mai-autos:customers";
const K_SERVICE = "mai-autos:service";

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

  async listVehicles() {
    if (typeof window === "undefined") return [];
    try { return (JSON.parse(window.localStorage.getItem(K_VEHICLES) || "[]") as StockVehicle[]).map(v => ({ ...v, supplier: v.supplier || "", acquisitionDate: v.acquisitionDate || "", purchaseAmount: Number(v.purchaseAmount) || 0, purchaseCurrency: v.purchaseCurrency || "USD", purchaseRateToBase: Number(v.purchaseRateToBase) || 1, reportingCurrency: v.reportingCurrency || "USD", additionalCosts: v.additionalCosts || [] })).sort((a,b) => b.updatedAt.localeCompare(a.updatedAt)); }
    catch { return []; }
  },

  async saveVehicle(vehicle) {
    const list = await this.listVehicles();
    const now = new Date().toISOString();
    const old = list.find(v => v.id === vehicle.id);
    const next = { ...vehicle, createdAt: old?.createdAt || vehicle.createdAt || now, updatedAt: now };
    const updated = old ? list.map(v => v.id === next.id ? next : v) : [next, ...list];
    window.localStorage.setItem(K_VEHICLES, JSON.stringify(updated));
    return next;
  },

  async removeVehicle(id) {
    const list = await this.listVehicles();
    window.localStorage.setItem(K_VEHICLES, JSON.stringify(list.filter(v => v.id !== id)));
  },

  async listDeals() {
    if (typeof window === "undefined") return [];
    try { return (JSON.parse(window.localStorage.getItem(K_DEALS) || "[]") as DealRecord[]).sort((a,b) => b.updatedAt.localeCompare(a.updatedAt)); }
    catch { return []; }
  },

  async saveDeal(deal) {
    const list = await this.listDeals(); const now = new Date().toISOString();
    const next = { ...deal, createdAt: list.find(d => d.id === deal.id)?.createdAt || deal.createdAt || now, updatedAt: now };
    window.localStorage.setItem(K_DEALS, JSON.stringify(list.some(d => d.id === deal.id) ? list.map(d => d.id === deal.id ? next : d) : [next, ...list]));
    return next;
  },

  async removeDeal(id) {
    const list = await this.listDeals(); window.localStorage.setItem(K_DEALS, JSON.stringify(list.filter(d => d.id !== id)));
  },

  async listCustomers() {
    if (typeof window === "undefined") return [];
    try { return (JSON.parse(window.localStorage.getItem(K_CUSTOMERS) || "[]") as CustomerRecord[]).sort((a,b) => b.updatedAt.localeCompare(a.updatedAt)); } catch { return []; }
  },
  async saveCustomer(customer) {
    const list = await this.listCustomers(); const now = new Date().toISOString();
    const next = { ...customer, createdAt: list.find(c => c.id === customer.id)?.createdAt || customer.createdAt || now, updatedAt: now };
    window.localStorage.setItem(K_CUSTOMERS, JSON.stringify(list.some(c => c.id === customer.id) ? list.map(c => c.id === next.id ? next : c) : [next, ...list])); return next;
  },
  async removeCustomer(id) {
    const list = await this.listCustomers(); window.localStorage.setItem(K_CUSTOMERS, JSON.stringify(list.filter(c => c.id !== id)));
  },
  async listServiceRecords() {
    if (typeof window === "undefined") return [];
    try { return (JSON.parse(window.localStorage.getItem(K_SERVICE) || "[]") as ServiceRecord[]).sort((a,b) => b.updatedAt.localeCompare(a.updatedAt)); } catch { return []; }
  },
  async saveServiceRecord(record) {
    const list = await this.listServiceRecords(); const now=new Date().toISOString(); const next={...record,createdAt:list.find(r=>r.id===record.id)?.createdAt||record.createdAt||now,updatedAt:now};
    window.localStorage.setItem(K_SERVICE,JSON.stringify(list.some(r=>r.id===next.id)?list.map(r=>r.id===next.id?next:r):[next,...list]));return next;
  },
  async removeServiceRecord(id) { const list=await this.listServiceRecords();window.localStorage.setItem(K_SERVICE,JSON.stringify(list.filter(r=>r.id!==id))); },
};
