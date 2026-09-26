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
    getStore()
      .getSettings()
      .then((settings) => setState({ settings, invoice: newInvoice(settings) }))
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load settings."));
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
