import type { Invoice, LineItem, Settings } from "./types";
import { addDaysISO, pad, todayISO } from "./format";

export const DEFAULT_TERMS = [
  "Payment is due by the due date shown above. The vehicle will be released only after payment has been received in full.",
  "Ownership and title of the vehicle pass to the buyer only upon receipt of full payment.",
  "The vehicle is sold in its current condition unless a written warranty is provided by MAI AUTOS.",
  "The buyer should inspect the vehicle and verify the details above (including VIN and mileage) before taking delivery.",
  "Deposits are non-refundable unless otherwise agreed in writing.",
].join("\n");

export function defaultSettings(): Settings {
  return {
    companyName: "MAI AUTOS",
    tagline: "PREMIUM DEALERSHIP",
    address: "Abuja, Nigeria",
    phone: "",
    email: "",
    bankName: "",
    accountName: "MAI AUTOS",
    accountNumber: "",
    defaultCurrency: "USD",
    vatRate: 7.5,
    paymentTerms: "Due on receipt",
    invoicePrefix: "MA",
    nextNumber: 1,
    terms: DEFAULT_TERMS,
    thankYou: "Thank you for choosing MAI AUTOS.",
  };
}

/** Merge whatever is stored with the defaults so new fields never come back undefined. */
export function withDefaults(partial: Partial<Settings> | null | undefined): Settings {
  return { ...defaultSettings(), ...(partial ?? {}) };
}

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function nextInvoiceNumber(s: Settings, date = todayISO()): string {
  const year = date.slice(0, 4);
  return `${s.invoicePrefix || "INV"}-${year}-${pad(s.nextNumber || 1)}`;
}

export function blankItem(description = ""): LineItem {
  return { id: uid(), description, qty: 1, unitPrice: 0 };
}

export function newInvoice(s: Settings): Invoice {
  const today = todayISO();
  const now = new Date().toISOString();
  return {
    id: uid(),
    number: nextInvoiceNumber(s, today),
    issueDate: today,
    dueDate: addDaysISO(today, 7),
    paymentTerms: s.paymentTerms,
    currency: s.defaultCurrency,
    customer: { name: "", address: "", city: "", phone: "", email: "" },
    vehicle: {
      year: "",
      make: "",
      model: "",
      vin: "",
      colour: "",
      mileage: "",
      engine: "",
      transmission: "",
      stockNo: "",
    },
    items: [
      blankItem("Vehicle Sale"),
      blankItem("Delivery / Transportation"),
      blankItem("Documentation & Registration"),
    ],
    discount: 0,
    vatRate: s.vatRate,
    amountPaid: 0,
    notes: "",
    terms: s.terms,
    createdAt: now,
    updatedAt: now,
  };
}
