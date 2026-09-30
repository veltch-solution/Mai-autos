export type VehicleCategory = "new" | "locally_used" | "foreign_used";
export type VehicleStatus = "in_stock" | "reserved" | "sold" | "in_transit" | "preparation";

import type { Currency } from "./types";

export interface VehicleCost {
  id: string;
  label: string;
  amount: number;
  currency: Currency;
  rateToBase: number;
  date: string;
}

export interface StockVehicle {
  id: string;
  stockNo: string;
  category: VehicleCategory;
  status: VehicleStatus;
  year: string;
  make: string;
  model: string;
  trim: string;
  vin: string;
  engineNumber: string;
  mileage: string;
  condition: string;
  colour: string;
  transmission: string;
  fuelType: string;
  location: string;
  notes: string;
  supplier: string;
  acquisitionDate: string;
  purchaseAmount: number;
  purchaseCurrency: Currency;
  purchaseRateToBase: number;
  reportingCurrency: Currency;
  additionalCosts: VehicleCost[];
  createdAt: string;
  updatedAt: string;
}

export const CATEGORY_LABEL: Record<VehicleCategory, string> = {
  new: "New",
  locally_used: "Locally used",
  foreign_used: "Foreign used",
};
export const STATUS_LABEL: Record<VehicleStatus, string> = {
  in_stock: "In stock",
  reserved: "Reserved",
  sold: "Sold",
  in_transit: "In transit",
  preparation: "In preparation",
};
export const EMPTY_VEHICLE: Omit<StockVehicle, "id" | "createdAt" | "updatedAt"> = {
  stockNo: "", category: "foreign_used", status: "in_stock", year: "", make: "", model: "", trim: "",
  vin: "", engineNumber: "", mileage: "", condition: "", colour: "", transmission: "", fuelType: "",
  location: "", notes: "", supplier: "", acquisitionDate: "", purchaseAmount: 0, purchaseCurrency: "USD",
  purchaseRateToBase: 1, reportingCurrency: "USD", additionalCosts: [],
};

export function totalLandedCost(vehicle: Pick<StockVehicle, "purchaseAmount" | "purchaseRateToBase" | "additionalCosts">): number {
  return (Number(vehicle.purchaseAmount) || 0) * (Number(vehicle.purchaseRateToBase) || 0) + vehicle.additionalCosts.reduce((sum, cost) => sum + (Number(cost.amount) || 0) * (Number(cost.rateToBase) || 0), 0);
}
