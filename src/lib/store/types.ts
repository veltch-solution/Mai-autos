import type { Invoice, InvoiceSummary, Settings } from "../types";
import type { StockVehicle } from "../stock";
import type { DealRecord } from "../deals";
import type { CustomerRecord } from "../customers";
import type { ServiceRecord } from "../service";

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
  listDeals(): Promise<DealRecord[]>;
  saveDeal(deal: DealRecord): Promise<DealRecord>;
  removeDeal(id: string): Promise<void>;
  listCustomers(): Promise<CustomerRecord[]>;
  saveCustomer(customer: CustomerRecord): Promise<CustomerRecord>;
  removeCustomer(id: string): Promise<void>;
  listServiceRecords(): Promise<ServiceRecord[]>;
  saveServiceRecord(record: ServiceRecord): Promise<ServiceRecord>;
  removeServiceRecord(id: string): Promise<void>;
}
