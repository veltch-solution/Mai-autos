import type { Invoice, InvoiceSummary, Settings } from "../types";
import type { StockVehicle } from "../stock";

export interface InvoiceStore {
  readonly kind: "supabase" | "local";
  list(): Promise<InvoiceSummary[]>;
  get(id: string): Promise<Invoice | null>;
  save(invoice: Invoice): Promise<Invoice>;
  remove(id: string): Promise<void>;
  getSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<void>;
  listVehicles(): Promise<StockVehicle[]>;
  saveVehicle(vehicle: StockVehicle): Promise<StockVehicle>;
  removeVehicle(id: string): Promise<void>;
}
