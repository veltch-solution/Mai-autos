"use client";

import InvoiceSheet from "@/components/InvoiceSheet";
import ScaledSheet from "@/components/ScaledSheet";
import { Alert, Button, Card, Field, Input, NumInput, Select, StatusBadge, Textarea } from "@/components/ui";
import { computeTotals, lineAmount } from "@/lib/calc";
import { blankItem } from "@/lib/defaults";
import { formatMoney } from "@/lib/format";
import { getStore } from "@/lib/store";
import { CURRENCIES, type Customer, type Invoice, type LineItem, type Settings, type Vehicle } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export default function InvoiceEditor({
  initial,
  settings,
  isNew,
}: {
  initial: Invoice;
  settings: Settings;
  isNew: boolean;
}) {
  const router = useRouter();
  const [inv, setInv] = useState<Invoice>(initial);
  const [saving, setSaving] = useState<"save" | "print" | null>(null);
  const [error, setError] = useState<string>("");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [dirty, setDirty] = useState(false);
  const firstSaveDone = useRef(!isNew);

  const totals = useMemo(() => computeTotals(inv), [inv]);

  // ----- state helpers -------------------------------------------------------
  const patch = useCallback((p: Partial<Invoice>) => {
    setInv((prev) => ({ ...prev, ...p }));
    setDirty(true);
  }, []);
  const patchCustomer = (p: Partial<Customer>) => patch({ customer: { ...inv.customer, ...p } });
  const patchVehicle = (p: Partial<Vehicle>) => patch({ vehicle: { ...inv.vehicle, ...p } });
  const patchItem = (id: string, p: Partial<LineItem>) =>
    patch({ items: inv.items.map((it) => (it.id === id ? { ...it, ...p } : it)) });
  const addItem = () => patch({ items: [...inv.items, blankItem()] });
  const removeItem = (id: string) => patch({ items: inv.items.filter((it) => it.id !== id) });

  // Warn before leaving with unsaved changes
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // Keyboard shortcut: Ctrl/Cmd + S
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void save(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inv]);

  // ----- actions -------------------------------------------------------------
  async function save(thenPrint: boolean) {
    setError("");
    if (!inv.number.trim()) {
      setError("Please enter an invoice number.");
      return;
    }
    setSaving(thenPrint ? "print" : "save");
    try {
      const store = getStore();
      const saved = await store.save(inv);
      setInv(saved);
      setDirty(false);
      setSavedAt(new Date());

      // First save of a brand-new invoice: bump the auto-number counter
      if (!firstSaveDone.current) {
        firstSaveDone.current = true;
        const fresh = await store.getSettings();
        await store.saveSettings({ ...fresh, nextNumber: (fresh.nextNumber || 1) + 1 });
      }

      if (thenPrint) {
        router.push(`/invoices/${saved.id}/print?auto=1`);
        return;
      }
      if (isNew) router.replace(`/invoices/${saved.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the invoice.");
    } finally {
      setSaving(null);
    }
  }

  async function remove() {
    if (!confirm(`Delete invoice ${inv.number}? This cannot be undone.`)) return;
    try {
      await getStore().remove(inv.id);
      setDirty(false);
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete the invoice.");
    }
  }

  // ----- render --------------------------------------------------------------
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Toolbar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight">{isNew && !firstSaveDone.current ? "New Invoice" : `Invoice ${inv.number}`}</h1>
          <StatusBadge status={totals.status} />
          {savedAt && !dirty && (
            <span className="text-xs text-neutral-400">Saved {savedAt.toLocaleTimeString()}</span>
          )}
          {dirty && <span className="text-xs text-amber-600">Unsaved changes</span>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isNew && (
            <Button variant="danger" onClick={remove}>
              Delete
            </Button>
          )}
          <Button variant="secondary" onClick={() => save(false)} disabled={saving !== null}>
            {saving === "save" ? "Saving…" : "Save"}
          </Button>
          <Button onClick={() => save(true)} disabled={saving !== null}>
            {saving === "print" ? "Saving…" : "Save & Print / PDF"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,7fr)_minmax(0,8fr)]">
        {/* ============================== FORM ============================== */}
        <div className="min-w-0 space-y-5">
          <Card title="Invoice details">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label="Invoice No." className="col-span-2 sm:col-span-1">
                <Input value={inv.number} onChange={(e) => patch({ number: e.target.value })} />
              </Field>
              <Field label="Currency">
                <Select value={inv.currency} onChange={(e) => patch({ currency: e.target.value as Invoice["currency"] })}>
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Invoice date">
                <Input type="date" value={inv.issueDate} onChange={(e) => patch({ issueDate: e.target.value })} />
              </Field>
              <Field label="Due date">
                <Input type="date" value={inv.dueDate} onChange={(e) => patch({ dueDate: e.target.value })} />
              </Field>
              <Field label="Payment terms" className="col-span-2 sm:col-span-4">
                <Input
                  value={inv.paymentTerms}
                  placeholder="e.g. Due on receipt, 50% deposit, 7 days"
                  onChange={(e) => patch({ paymentTerms: e.target.value })}
                />
              </Field>
            </div>
          </Card>

          <Card title="Customer (Bill to)">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Customer / company name" className="col-span-2">
                <Input value={inv.customer.name} onChange={(e) => patchCustomer({ name: e.target.value })} autoFocus={isNew} />
              </Field>
              <Field label="Street address" className="col-span-2 sm:col-span-1">
                <Input value={inv.customer.address} onChange={(e) => patchCustomer({ address: e.target.value })} />
              </Field>
              <Field label="City, State" className="col-span-2 sm:col-span-1">
                <Input value={inv.customer.city} onChange={(e) => patchCustomer({ city: e.target.value })} />
              </Field>
              <Field label="Phone">
                <Input value={inv.customer.phone} inputMode="tel" onChange={(e) => patchCustomer({ phone: e.target.value })} />
              </Field>
              <Field label="Email">
                <Input value={inv.customer.email} inputMode="email" onChange={(e) => patchCustomer({ email: e.target.value })} />
              </Field>
            </div>
          </Card>

          <Card title="Vehicle details">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Field label="Year">
                <Input value={inv.vehicle.year} inputMode="numeric" placeholder="2017" onChange={(e) => patchVehicle({ year: e.target.value })} />
              </Field>
              <Field label="Make">
                <Input value={inv.vehicle.make} placeholder="Mercedes-Benz" onChange={(e) => patchVehicle({ make: e.target.value })} />
              </Field>
              <Field label="Model">
                <Input value={inv.vehicle.model} placeholder="C 300 4MATIC" onChange={(e) => patchVehicle({ model: e.target.value })} />
              </Field>
              <Field label="VIN / Chassis No." className="col-span-2">
                <Input
                  value={inv.vehicle.vin}
                  className="font-mono uppercase"
                  maxLength={17}
                  onChange={(e) => patchVehicle({ vin: e.target.value.toUpperCase() })}
                />
              </Field>
              <Field label="Colour">
                <Input value={inv.vehicle.colour} onChange={(e) => patchVehicle({ colour: e.target.value })} />
              </Field>
              <Field label="Mileage">
                <Input value={inv.vehicle.mileage} placeholder="e.g. 45,200 miles" onChange={(e) => patchVehicle({ mileage: e.target.value })} />
              </Field>
              <Field label="Engine">
                <Input value={inv.vehicle.engine} placeholder="2.0L Turbo" onChange={(e) => patchVehicle({ engine: e.target.value })} />
              </Field>
              <Field label="Transmission">
                <Input value={inv.vehicle.transmission} placeholder="Automatic" onChange={(e) => patchVehicle({ transmission: e.target.value })} />
              </Field>
              <Field label="Stock / Lot No." className="col-span-2 sm:col-span-3">
                <Input value={inv.vehicle.stockNo} onChange={(e) => patchVehicle({ stockNo: e.target.value })} />
              </Field>
            </div>
          </Card>

          <Card
            title="Charges"
            action={
              <Button variant="secondary" className="!px-3 !py-1.5 text-xs" onClick={addItem}>
                + Add line
              </Button>
            }
          >
            <div className="space-y-2">
              <div className="hidden grid-cols-[1fr_64px_120px_110px_32px] gap-2 px-1 text-[11px] font-medium uppercase tracking-wider text-neutral-400 sm:grid">
                <span>Description</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Unit price</span>
                <span className="text-right">Amount</span>
                <span />
              </div>
              {inv.items.map((it) => (
                <div key={it.id} className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1fr_64px_120px_110px_32px]">
                  <Input
                    value={it.description}
                    placeholder="Description"
                    className="col-span-2 sm:col-span-1"
                    onChange={(e) => patchItem(it.id, { description: e.target.value })}
                  />
                  <div className="grid grid-cols-[64px_1fr_1fr_32px] gap-2 sm:contents">
                    <NumInput value={it.qty} onChange={(n) => patchItem(it.id, { qty: n })} placeholder="1" aria-label="Quantity" />
                    <NumInput value={it.unitPrice} onChange={(n) => patchItem(it.id, { unitPrice: n })} placeholder="0.00" aria-label="Unit price" />
                    <div className="flex items-center justify-end rounded-lg bg-neutral-50 px-3 text-sm tabular-nums text-neutral-700">
                      {formatMoney(lineAmount(it.qty, it.unitPrice), inv.currency)}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(it.id)}
                      className="flex h-9 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-600"
                      title="Remove line"
                      aria-label="Remove line"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
              {inv.items.length === 0 && (
                <p className="py-3 text-center text-sm text-neutral-400">No charges yet — add a line.</p>
              )}
            </div>

            <div className="mt-5 grid gap-3 border-t border-neutral-100 pt-4 sm:grid-cols-3">
              <Field label={`Discount (${inv.currency})`}>
                <NumInput value={inv.discount} onChange={(n) => patch({ discount: n })} placeholder="0.00" />
              </Field>
              <Field label="VAT rate (%)" hint="Set 0 if VAT is not charged">
                <NumInput value={inv.vatRate} onChange={(n) => patch({ vatRate: n })} placeholder="0" />
              </Field>
              <Field label={`Amount paid / deposit (${inv.currency})`}>
                <NumInput value={inv.amountPaid} onChange={(n) => patch({ amountPaid: n })} placeholder="0.00" />
              </Field>
            </div>

            <dl className="mt-4 ml-auto w-full max-w-xs space-y-1 text-sm">
              <Row k="Subtotal" v={formatMoney(totals.subtotal, inv.currency)} />
              {totals.discount > 0 && <Row k="Discount" v={"-" + formatMoney(totals.discount, inv.currency)} />}
              {inv.vatRate > 0 && <Row k={`VAT (${inv.vatRate}%)`} v={formatMoney(totals.vat, inv.currency)} />}
              <Row k="Total" v={formatMoney(totals.total, inv.currency)} strong />
              {totals.amountPaid > 0 && <Row k="Paid" v={formatMoney(totals.amountPaid, inv.currency)} />}
              <Row k="Balance due" v={formatMoney(totals.balance, inv.currency)} strong />
            </dl>
          </Card>

          <Card title="Notes & terms">
            <div className="space-y-3">
              <Field label="Notes (optional — printed on the invoice)">
                <Textarea rows={2} value={inv.notes} onChange={(e) => patch({ notes: e.target.value })} />
              </Field>
              <Field label="Terms & conditions" hint="One term per line. Defaults come from Settings.">
                <Textarea rows={5} value={inv.terms} onChange={(e) => patch({ terms: e.target.value })} />
              </Field>
            </div>
          </Card>
        </div>

        {/* ============================ PREVIEW ============================ */}
        <div className="min-w-0 lg:sticky lg:top-20 lg:self-start">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">Live preview</span>
            <span className="text-xs text-neutral-400">A4 · updates as you type</span>
          </div>
          <ScaledSheet>
            <InvoiceSheet invoice={inv} settings={settings} mode="preview" />
          </ScaledSheet>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, strong = false }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "font-semibold text-neutral-900" : "text-neutral-600"}`}>
      <dt>{k}</dt>
      <dd className="tabular-nums">{v}</dd>
    </div>
  );
}
