"use client";

import { Alert, Button, Card, Field, Input, NumInput, Select, Spinner, Textarea } from "@/components/ui";
import { nextInvoiceNumber } from "@/lib/defaults";
import { getStore, isDemoMode } from "@/lib/store";
import { CURRENCIES, type Settings } from "@/lib/types";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [s, setS] = useState<Settings | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getStore()
      .getSettings()
      .then(setS)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load settings."));
  }, []);

  const patch = (p: Partial<Settings>) => {
    setS((prev) => (prev ? { ...prev, ...p } : prev));
    setSaved(false);
  };

  async function save() {
    if (!s) return;
    setSaving(true);
    setError("");
    try {
      await getStore().saveSettings(s);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (error && !s)
    return (
      <div className="mx-auto max-w-3xl p-6">
        <Alert>{error}</Alert>
      </div>
    );
  if (!s)
    return (
      <div className="mx-auto max-w-3xl px-6">
        <Spinner />
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-neutral-500">These details appear on every invoice.</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-emerald-600">Saved ✓</span>}
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-5">
          <Alert>{error}</Alert>
        </div>
      )}
      {isDemoMode() && (
        <div className="mb-5">
          <Alert kind="info">Demo mode: settings are saved in this browser only.</Alert>
        </div>
      )}

      <div className="space-y-5">
        <Card title="Company">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Company name">
              <Input value={s.companyName} onChange={(e) => patch({ companyName: e.target.value })} />
            </Field>
            <Field label="Tagline">
              <Input value={s.tagline} onChange={(e) => patch({ tagline: e.target.value })} />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <Input value={s.address} onChange={(e) => patch({ address: e.target.value })} />
            </Field>
            <Field label="Phone">
              <Input value={s.phone} inputMode="tel" placeholder="+234 …" onChange={(e) => patch({ phone: e.target.value })} />
            </Field>
            <Field label="Email">
              <Input value={s.email} inputMode="email" onChange={(e) => patch({ email: e.target.value })} />
            </Field>
          </div>
        </Card>

        <Card title="Bank / payment details">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Bank name">
              <Input value={s.bankName} onChange={(e) => patch({ bankName: e.target.value })} />
            </Field>
            <Field label="Account name">
              <Input value={s.accountName} onChange={(e) => patch({ accountName: e.target.value })} />
            </Field>
            <Field label="Account number">
              <Input value={s.accountNumber} inputMode="numeric" onChange={(e) => patch({ accountNumber: e.target.value })} />
            </Field>
          </div>
        </Card>

        <Card title="Invoice defaults">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Default currency">
              <Select value={s.defaultCurrency} onChange={(e) => patch({ defaultCurrency: e.target.value as Settings["defaultCurrency"] })}>
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Default VAT rate (%)" hint="Nigeria's standard VAT is 7.5%. Use 0 if you don't charge VAT.">
              <NumInput value={s.vatRate} onChange={(n) => patch({ vatRate: n })} />
            </Field>
            <Field label="Default payment terms">
              <Input value={s.paymentTerms} onChange={(e) => patch({ paymentTerms: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Invoice prefix">
                <Input value={s.invoicePrefix} onChange={(e) => patch({ invoicePrefix: e.target.value.toUpperCase() })} />
              </Field>
              <Field label="Next number">
                <NumInput value={s.nextNumber} onChange={(n) => patch({ nextNumber: Math.max(1, Math.floor(n)) })} />
              </Field>
            </div>
            <p className="text-xs text-neutral-500 sm:col-span-2">
              Next invoice will be numbered <b className="text-neutral-800">{nextInvoiceNumber(s)}</b>. The number can still be
              edited on each invoice.
            </p>
          </div>
        </Card>

        <Card title="Text on the invoice">
          <div className="space-y-3">
            <Field label="Terms & conditions" hint="One term per line.">
              <Textarea rows={6} value={s.terms} onChange={(e) => patch({ terms: e.target.value })} />
            </Field>
            <Field label="Closing line">
              <Input value={s.thankYou} onChange={(e) => patch({ thankYou: e.target.value })} />
            </Field>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}
