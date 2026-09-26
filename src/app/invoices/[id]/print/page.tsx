"use client";

import InvoiceSheet from "@/components/InvoiceSheet";
import { Alert, Button, LinkButton, Spinner } from "@/components/ui";
import { getStore } from "@/lib/store";
import type { Invoice, Settings } from "@/lib/types";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Clean print view: just the A4 sheet plus a small toolbar that is hidden when printing.
 * Open with ?auto=1 to pop the print dialog automatically (Save & Print button).
 */
export default function PrintInvoicePage() {
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

  // Auto-print once everything (fonts + logo) is ready
  useEffect(() => {
    if (!state || state === "missing") return;
    const auto = new URLSearchParams(window.location.search).get("auto") === "1";
    if (!auto) return;
    let cancelled = false;
    const go = async () => {
      try {
        await document.fonts?.ready;
        const img = document.querySelector<HTMLImageElement>(".sheet img");
        if (img && !img.complete) await new Promise((r) => (img.onload = img.onerror = () => r(null)));
      } catch {
        /* ignore */
      }
      if (!cancelled) setTimeout(() => window.print(), 250);
    };
    void go();
    return () => {
      cancelled = true;
    };
  }, [state]);

  useEffect(() => {
    if (state && state !== "missing") document.title = `Invoice ${state.invoice.number} – MAI AUTOS`;
  }, [state]);

  if (error)
    return (
      <div className="mx-auto max-w-3xl p-6">
        <Alert>{error}</Alert>
      </div>
    );
  if (state === "missing")
    return (
      <div className="p-6 text-center">
        <p className="mb-4 text-neutral-600">That invoice could not be found.</p>
        <LinkButton href="/" variant="secondary">
          Back to invoices
        </LinkButton>
      </div>
    );
  if (!state) return <Spinner label="Preparing invoice…" />;

  return (
    <div className="print-root min-h-screen bg-neutral-200 py-6">
      <div className="no-print mx-auto mb-4 flex w-[210mm] max-w-full flex-wrap items-center justify-between gap-3 px-2">
        <div className="flex items-center gap-2">
          <LinkButton href={`/invoices/${state.invoice.id}`} variant="secondary">
            ← Back to editor
          </LinkButton>
          <LinkButton href="/" variant="ghost">
            All invoices
          </LinkButton>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-neutral-500 sm:inline">Choose “Save as PDF” in the print dialog to download a PDF</span>
          <Button onClick={() => window.print()}>Print / Save as PDF</Button>
        </div>
      </div>
      <div className="mx-auto w-[210mm] max-w-full overflow-x-auto">
        <div className="sheet-wrap shadow-xl">
          <InvoiceSheet invoice={state.invoice} settings={state.settings} mode="print" />
        </div>
      </div>
    </div>
  );
}
