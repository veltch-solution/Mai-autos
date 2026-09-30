import type { Currency } from "./types";

export type DealStage = "enquiry" | "reserved" | "in_progress" | "completed" | "cancelled";
export type DealType = "retail_sale" | "trade_in_swap";

export interface DealRecord {
  id: string;
  dealNo: string;
  type: DealType;
  stage: DealStage;
  vehicleId: string;
  vehicleLabel: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  dealDate: string;
  currency: Currency;
  salePrice: number;
  amountPaid: number;
  tradeInMake: string;
  tradeInModel: string;
  tradeInYear: string;
  tradeInVin: string;
  tradeInCondition: string;
  tradeInValue: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export const DEAL_STAGE_LABEL: Record<DealStage, string> = {
  enquiry: "Enquiry", reserved: "Reserved", in_progress: "In progress", completed: "Completed", cancelled: "Cancelled",
};
export const DEAL_TYPE_LABEL: Record<DealType, string> = { retail_sale: "Retail sale", trade_in_swap: "Trade-in / swap" };
