export type VehicleCategory = "new" | "locally_used" | "foreign_used";
export type VehicleStatus = "in_stock" | "reserved" | "sold" | "in_transit" | "preparation";

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
  location: "", notes: "",
};
