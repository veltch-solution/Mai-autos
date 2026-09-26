"use client";

import InvoiceEditor from "@/components/InvoiceEditor";
import { Alert, LinkButton, Spinner } from "@/components/ui";
import { getStore } from "@/lib/store";
import type { Invoice, Settings } from "@/lib/types";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<{ invoice: Invoice; settings: Settings } | null | "missing">(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    const store = getStore();
    Promise.all([store.get(id), store.getSettings()])
      .then(([invoice, settings]) => setState(invoice ? { invoice, settings } : "missing"))
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load the invoice."));
  }, [id]);

  if (error)
    return (
      <div className="mx-auto max-w-3xl p-6">
        <Alert>{error}</Alert>
      </div>
    );
  if (state === "missing")
    return (
      <div className="mx-auto max-w-3xl p-6 text-center">
        <p className="mb-4 text-neutral-600">That invoice could not be found.</p>
        <LinkButton href="/" variant="secondary">
          Back to invoices
        </LinkButton>
      </div>
    );
  if (!state)
    return (
      <div className="mx-auto max-w-7xl px-6">
        <Spinner label="Loading invoice…" />
      </div>
    );
  return <InvoiceEditor key={state.invoice.id} initial={state.invoice} settings={state.settings} isNew={false} />;
}
