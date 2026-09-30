"use client";

import InvoiceEditor from "@/components/InvoiceEditor";
import { Alert, Spinner } from "@/components/ui";
import { newInvoice } from "@/lib/defaults";
import { getStore } from "@/lib/store";
import type { Invoice, Settings } from "@/lib/types";
import { useEffect, useState } from "react";

export default function NewInvoicePage() {
  const [state, setState] = useState<{ invoice: Invoice; settings: Settings } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function prepare() {
      try {
        const store = getStore();
        const settings = await store.getSettings();
        const invoice = newInvoice(settings);
        const dealId = new URLSearchParams(window.location.search).get("deal");
        if (dealId) {
          const [deal, vehicles] = await Promise.all([store.listDeals().then((list) => list.find((d) => d.id === dealId)), store.listVehicles()]);
          if (deal) {
            const stock = vehicles.find((v) => v.id === deal.vehicleId);
            invoice.customer = { ...invoice.customer, name: deal.customerName, phone: deal.customerPhone, email: deal.customerEmail };
            invoice.currency = deal.currency;
            invoice.amountPaid = deal.amountPaid;
            invoice.notes = `Sales deal ${deal.dealNo}${deal.type === "trade_in_swap" ? `; trade-in allowance ${deal.tradeInValue} ${deal.currency}` : ""}`;
            invoice.vehicle = {
              year: stock?.year || "", make: stock?.make || "", model: stock?.model || "", vin: stock?.vin || "",
              colour: stock?.colour || "", mileage: stock?.mileage || "", engine: stock?.engineNumber || "",
              transmission: stock?.transmission || "", stockNo: stock?.stockNo || "",
            };
            invoice.items = invoice.items.map((item, index) => index === 0 ? { ...item, description: `Vehicle Sale${deal.dealNo ? ` — ${deal.dealNo}` : ""}`, unitPrice: deal.salePrice } : item);
            if (deal.type === "trade_in_swap" && deal.tradeInValue > 0) invoice.discount = deal.tradeInValue;
          }
        }
        setState({ settings, invoice });
      } catch (e) { setError(e instanceof Error ? e.message : "Could not prepare invoice."); }
    }
    void prepare();
  }, []);

  if (error)
    return (
      <div className="mx-auto max-w-3xl p-6">
        <Alert>{error}</Alert>
      </div>
    );
  if (!state)
    return (
      <div className="mx-auto max-w-7xl px-6">
        <Spinner label="Preparing a new invoice…" />
      </div>
    );
  return <InvoiceEditor initial={state.invoice} settings={state.settings} isNew />;
}
