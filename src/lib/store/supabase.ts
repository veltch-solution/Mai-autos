/**
 * Supabase-backed store. Tables are defined in /supabase/schema.sql.
 * The full invoice is kept as JSON in `data`; a few columns are copied out
 * so the invoice list can be queried and searched cheaply.
 */
import { computeTotals, vehicleLabel } from "../calc";
import { withDefaults } from "../defaults";
import { getSupabase } from "../supabase/client";
import type { Currency, Invoice, InvoiceSummary, Settings } from "../types";
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
};
