/**
 * Supabase-backed store. Tables are defined in /supabase/schema.sql.
 * The full invoice is kept as JSON in `data`; a few columns are copied out
 * so the invoice list can be queried and searched cheaply.
 */
import { computeTotals, vehicleLabel } from "../calc";
import { withDefaults } from "../defaults";
import { getSupabase } from "../supabase/client";
import type { Currency, Invoice, InvoiceSummary, Settings } from "../types";
import type { StockVehicle } from "../stock";
import type { InvoiceStore } from "./types";

interface InvoiceRow {
  id: string;
  number: string;
  issue_date: string | null;
  customer_name: string | null;
  vehicle: string | null;
  currency: string;
  total: number | string;
  balance: number | string;
  updated_at: string;
}

function friendly(message: string): string {
  if (/duplicate key|unique/i.test(message)) {
    return "That invoice number already exists. Please use a different number.";
  }
  if (/JWT|not authenticated|permission|row-level security/i.test(message)) {
    return "You are not signed in (or your session expired). Please sign in again.";
  }
  if (/relation .* does not exist/i.test(message)) {
    return "Database tables not found. Run supabase/schema.sql in the Supabase SQL editor.";
  }
  return message;
}

export const supabaseStore: InvoiceStore = {
  kind: "supabase",

  async list() {
    const { data, error } = await getSupabase()
      .from("invoices")
      .select("id, number, issue_date, customer_name, vehicle, currency, total, balance, updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(friendly(error.message));
    return (data as InvoiceRow[]).map<InvoiceSummary>((r) => ({
      id: r.id,
      number: r.number,
      issueDate: r.issue_date ?? "",
      customerName: r.customer_name ?? "",
      vehicle: r.vehicle ?? "",
      currency: (r.currency as Currency) || "USD",
      total: Number(r.total) || 0,
      balance: Number(r.balance) || 0,
      updatedAt: r.updated_at,
    }));
  },

  async get(id) {
    const { data, error } = await getSupabase()
      .from("invoices")
      .select("data")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(friendly(error.message));
    if (!data) return null;
    return { ...(data.data as Invoice), id };
  },

  async save(invoice) {
    const now = new Date().toISOString();
    const next: Invoice = { ...invoice, updatedAt: now };
    const t = computeTotals(next);
    const { error } = await getSupabase().from("invoices").upsert(
      {
        id: next.id,
        number: next.number,
        issue_date: next.issueDate || null,
        due_date: next.dueDate || null,
        customer_name: next.customer.name || null,
        vehicle: vehicleLabel(next.vehicle) || null,
        currency: next.currency,
        total: t.total,
        balance: t.balance,
        data: next,
        updated_at: now,
      },
      { onConflict: "id" }
    );
    if (error) throw new Error(friendly(error.message));
    return next;
  },

  async remove(id) {
    const { error } = await getSupabase().from("invoices").delete().eq("id", id);
    if (error) throw new Error(friendly(error.message));
  },

  async getSettings() {
    const { data, error } = await getSupabase()
      .from("settings")
      .select("data")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw new Error(friendly(error.message));
    return withDefaults((data?.data as Partial<Settings>) ?? null);
  },

  async saveSettings(settings) {
    const { error } = await getSupabase()
      .from("settings")
      .upsert({ id: 1, data: settings, updated_at: new Date().toISOString() }, { onConflict: "id" });
    if (error) throw new Error(friendly(error.message));
  },

  async listVehicles() {
    const { data, error } = await getSupabase().from("vehicles").select("*").order("updated_at", { ascending: false });
    if (error) throw new Error(friendly(error.message));
    return (data || []).map((r: Record<string, unknown>) => ({
      id: String(r.id), stockNo: String(r.stock_no || ""), category: r.category as StockVehicle["category"],
      status: r.status as StockVehicle["status"], year: String(r.year || ""), make: String(r.make || ""),
      model: String(r.model || ""), trim: String(r.trim || ""), vin: String(r.vin || ""),
      engineNumber: String(r.engine_number || ""), mileage: String(r.mileage || ""), condition: String(r.condition || ""),
      colour: String(r.colour || ""), transmission: String(r.transmission || ""), fuelType: String(r.fuel_type || ""),
      location: String(r.location || ""), notes: String(r.notes || ""), createdAt: String(r.created_at || ""), updatedAt: String(r.updated_at || ""),
    } as StockVehicle));
  },

  async saveVehicle(vehicle) {
    const now = new Date().toISOString();
    const row = {
      id: vehicle.id, stock_no: vehicle.stockNo || null, category: vehicle.category, status: vehicle.status,
      year: vehicle.year || null, make: vehicle.make, model: vehicle.model, trim: vehicle.trim || null,
      vin: vehicle.vin || null, engine_number: vehicle.engineNumber || null, mileage: vehicle.mileage || null,
      condition: vehicle.condition || null, colour: vehicle.colour || null, transmission: vehicle.transmission || null,
      fuel_type: vehicle.fuelType || null, location: vehicle.location || null, notes: vehicle.notes || null, updated_at: now,
    };
    const { data, error } = await getSupabase().from("vehicles").upsert(row, { onConflict: "id" }).select("created_at").single();
    if (error) throw new Error(friendly(error.message));
    return { ...vehicle, createdAt: String(data.created_at), updatedAt: now };
  },

  async removeVehicle(id) {
    const { error } = await getSupabase().from("vehicles").delete().eq("id", id);
    if (error) throw new Error(friendly(error.message));
  },
};
