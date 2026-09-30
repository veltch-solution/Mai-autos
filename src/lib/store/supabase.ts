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
import type { DealRecord } from "../deals";
import type { CustomerRecord } from "../customers";
import type { ServiceRecord } from "../service";
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
      location: String(r.location || ""), notes: String(r.notes || ""), supplier: String(r.supplier || ""),
      acquisitionDate: String(r.acquisition_date || ""), purchaseAmount: Number(r.purchase_amount || 0),
      purchaseCurrency: (r.purchase_currency as Currency) || "USD", purchaseRateToBase: Number(r.purchase_rate_to_base || 1),
      reportingCurrency: (r.reporting_currency as Currency) || "USD", additionalCosts: Array.isArray(r.additional_costs) ? r.additional_costs as StockVehicle["additionalCosts"] : [], createdAt: String(r.created_at || ""), updatedAt: String(r.updated_at || ""),
    } as StockVehicle));
  },

  async saveVehicle(vehicle) {
    const now = new Date().toISOString();
    const row = {
      id: vehicle.id, stock_no: vehicle.stockNo || null, category: vehicle.category, status: vehicle.status,
      year: vehicle.year || null, make: vehicle.make, model: vehicle.model, trim: vehicle.trim || null,
      vin: vehicle.vin || null, engine_number: vehicle.engineNumber || null, mileage: vehicle.mileage || null,
      condition: vehicle.condition || null, colour: vehicle.colour || null, transmission: vehicle.transmission || null,
      fuel_type: vehicle.fuelType || null, location: vehicle.location || null, notes: vehicle.notes || null,
      supplier: vehicle.supplier || null, acquisition_date: vehicle.acquisitionDate || null, purchase_amount: vehicle.purchaseAmount || 0,
      purchase_currency: vehicle.purchaseCurrency || "USD", purchase_rate_to_base: vehicle.purchaseRateToBase || 1,
      reporting_currency: vehicle.reportingCurrency || "USD", additional_costs: vehicle.additionalCosts || [], updated_at: now,
    };
    const { data, error } = await getSupabase().from("vehicles").upsert(row, { onConflict: "id" }).select("created_at").single();
    if (error) throw new Error(friendly(error.message));
    return { ...vehicle, createdAt: String(data.created_at), updatedAt: now };
  },

  async removeVehicle(id) {
    const { error } = await getSupabase().from("vehicles").delete().eq("id", id);
    if (error) throw new Error(friendly(error.message));
  },

  async listDeals() {
    const { data, error } = await getSupabase().from("deals").select("data").order("updated_at", { ascending: false });
    if (error) throw new Error(friendly(error.message));
    return (data || []).map((r: { data: DealRecord }) => r.data);
  },

  async saveDeal(deal) {
    const now = new Date().toISOString(); const next = { ...deal, updatedAt: now };
    const { error } = await getSupabase().from("deals").upsert({ id: next.id, deal_no: next.dealNo, stage: next.stage, customer_name: next.customerName || null, vehicle_id: next.vehicleId || null, data: next, updated_at: now }, { onConflict: "id" });
    if (error) throw new Error(friendly(error.message));
    return next;
  },

  async removeDeal(id) {
    const { error } = await getSupabase().from("deals").delete().eq("id", id);
    if (error) throw new Error(friendly(error.message));
  },
  async listCustomers() {
    const { data, error } = await getSupabase().from("customers").select("*").order("updated_at", { ascending: false });
    if (error) throw new Error(friendly(error.message));
    return (data || []).map((r: Record<string, unknown>) => ({ id:String(r.id), name:String(r.name||""), phone:String(r.phone||""), email:String(r.email||""), address:String(r.address||""), city:String(r.city||""), kind:r.kind as CustomerRecord["kind"], source:String(r.source||""), nextFollowUp:String(r.next_follow_up||""), notes:String(r.notes||""), createdAt:String(r.created_at||""), updatedAt:String(r.updated_at||"") } as CustomerRecord));
  },
  async saveCustomer(customer) {
    const now = new Date().toISOString();
    const row = { id:customer.id, name:customer.name, phone:customer.phone||null, email:customer.email||null, address:customer.address||null, city:customer.city||null, kind:customer.kind, source:customer.source||null, next_follow_up:customer.nextFollowUp||null, notes:customer.notes||null, updated_at:now };
    const { data, error } = await getSupabase().from("customers").upsert(row,{onConflict:"id"}).select("created_at").single();
    if (error) throw new Error(friendly(error.message)); return { ...customer, createdAt:String(data.created_at), updatedAt:now };
  },
  async removeCustomer(id) { const { error } = await getSupabase().from("customers").delete().eq("id",id); if (error) throw new Error(friendly(error.message)); },
  async listServiceRecords() {
    const {data,error}=await getSupabase().from("service_records").select("*").order("updated_at",{ascending:false});if(error)throw new Error(friendly(error.message));
    return(data||[]).map((r:Record<string,unknown>)=>({id:String(r.id),vehicleId:String(r.vehicle_id||""),vehicleLabel:String(r.vehicle_label||""),customerName:String(r.customer_name||""),customerPhone:String(r.customer_phone||""),jobType:String(r.job_type||""),status:r.status as ServiceRecord["status"],receivedDate:String(r.received_date||""),dueDate:String(r.due_date||""),warrantyUntil:String(r.warranty_until||""),warrantyProvider:String(r.warranty_provider||""),estimatedCost:Number(r.estimated_cost||0),actualCost:Number(r.actual_cost||0),notes:String(r.notes||""),createdAt:String(r.created_at||""),updatedAt:String(r.updated_at||"")} as ServiceRecord));
  },
  async saveServiceRecord(record) {
    const now=new Date().toISOString();const row={id:record.id,vehicle_id:record.vehicleId||null,vehicle_label:record.vehicleLabel||null,customer_name:record.customerName||null,customer_phone:record.customerPhone||null,job_type:record.jobType,status:record.status,received_date:record.receivedDate||null,due_date:record.dueDate||null,warranty_until:record.warrantyUntil||null,warranty_provider:record.warrantyProvider||null,estimated_cost:record.estimatedCost||0,actual_cost:record.actualCost||0,notes:record.notes||null,updated_at:now};
    const {data,error}=await getSupabase().from("service_records").upsert(row,{onConflict:"id"}).select("created_at").single();if(error)throw new Error(friendly(error.message));return{...record,createdAt:String(data.created_at),updatedAt:now};
  },
  async removeServiceRecord(id) { const {error}=await getSupabase().from("service_records").delete().eq("id",id);if(error)throw new Error(friendly(error.message)); },
};
