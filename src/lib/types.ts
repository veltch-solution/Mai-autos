export type Currency = "USD" | "NGN" | "EUR" | "GBP";

export const CURRENCIES: { code: Currency; symbol: string; label: string }[] = [
  { code: "USD", symbol: "$", label: "US Dollar ($)" },
  { code: "NGN", symbol: "₦", label: "Nigerian Naira (₦)" },
  { code: "EUR", symbol: "€", label: "Euro (€)" },
  { code: "GBP", symbol: "£", label: "British Pound (£)" },
];

export interface LineItem {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
}

export interface Customer {
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
}

export interface Vehicle {
  year: string;
  make: string;
  model: string;
  vin: string;
  colour: string;
  mileage: string;
  engine: string;
  transmission: string;
  stockNo: string;
}

export interface Invoice {
  id: string;
  number: string;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD or ""
  paymentTerms: string;
  currency: Currency;
  customer: Customer;
  vehicle: Vehicle;
  items: LineItem[];
  discount: number; // absolute amount
  vatRate: number; // percent
  amountPaid: number;
  notes: string;
  terms: string; // one term per line
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  companyName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  defaultCurrency: Currency;
  vatRate: number;
  paymentTerms: string;
  invoicePrefix: string;
  nextNumber: number;
  terms: string;
  thankYou: string;
}

export type InvoiceStatus = "unpaid" | "partial" | "paid";

export interface InvoiceSummary {
  id: string;
  number: string;
  issueDate: string;
  customerName: string;
  vehicle: string;
  currency: Currency;
  total: number;
  balance: number;
  updatedAt: string;
}
