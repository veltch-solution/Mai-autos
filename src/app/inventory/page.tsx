"use client";

import { Alert, Button, Card, Field, Input, Select, Spinner, Textarea } from "@/components/ui";
import { getStore, isDemoMode } from "@/lib/store";
import { CATEGORY_LABEL, EMPTY_VEHICLE, STATUS_LABEL, totalLandedCost, type StockVehicle, type VehicleCategory, type VehicleStatus, type VehicleCost } from "@/lib/stock";
import { CURRENCIES } from "@/lib/types";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

const blank = (): StockVehicle => ({ ...EMPTY_VEHICLE, id: crypto.randomUUID(), createdAt: "", updatedAt: "" });

export default function InventoryPage() {
  const [rows, setRows] = useState<StockVehicle[] | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState<StockVehicle | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try { setRows(await getStore().listVehicles()); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not load inventory."); setRows([]); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (rows || []).filter(v => (category === "all" || v.category === category) && (status === "all" || v.status === status) &&
      (!q || [v.stockNo,v.year,v.make,v.model,v.trim,v.vin,v.engineNumber,v.colour,v.location].join(" ").toLowerCase().includes(q)));
  }, [rows, query, category, status]);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!editing) return;
    setSaving(true); setError("");
    try {
      await getStore().saveVehicle({ ...editing, make: editing.make.trim(), model: editing.model.trim(), stockNo: editing.stockNo.trim(), vin: editing.vin.trim() });
      setEditing(null); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save vehicle."); }
    finally { setSaving(false); }
  }
  async function remove(v: StockVehicle) {
    if (!confirm(`Remove ${[v.year,v.make,v.model].filter(Boolean).join(" ")} from inventory?`)) return;
    try { await getStore().removeVehicle(v.id); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not remove vehicle."); }
  }
  const count = rows || [];
  const inStock = count.filter(v => v.status === "in_stock").length;
  const reserved = count.filter(v => v.status === "reserved").length;
  const inProgress = count.filter(v => v.status === "in_transit" || v.status === "preparation").length;

  return <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-xs font-semibold uppercase tracking-[.2em] text-neutral-400">Dealership operations</p><h1 className="mt-1 text-2xl font-bold tracking-tight">Vehicle inventory</h1><p className="text-sm text-neutral-500">Keep one searchable record for every vehicle, from arrival through sale.</p></div>
      <Button onClick={() => setEditing(blank())}>+ Add vehicle</Button>
    </div>
    {isDemoMode() && <div className="mb-5"><Alert kind="info"><b>Demo mode.</b> Inventory is saved in this browser only. For shared team records, connect Supabase and run the updated <code>supabase/schema.sql</code>.</Alert></div>}
    {error && <div className="mb-5"><Alert>{error}</Alert></div>}
    <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Metric label="Total vehicles" value={count.length}/><Metric label="In stock" value={inStock}/><Metric label="Reserved" value={reserved}/><Metric label="In transit / prep" value={inProgress}/>
    </div>
    <Card className="!p-0">
      <div className="flex flex-col gap-3 border-b border-neutral-100 p-4 sm:flex-row">
        <Input className="sm:max-w-md" placeholder="Search stock no., make, model, VIN…" value={query} onChange={e => setQuery(e.target.value)}/>
        <Select className="sm:max-w-48" value={category} onChange={e => setCategory(e.target.value)}><option value="all">All categories</option>{Object.entries(CATEGORY_LABEL).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</Select>
        <Select className="sm:max-w-48" value={status} onChange={e => setStatus(e.target.value)}><option value="all">All statuses</option>{Object.entries(STATUS_LABEL).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</Select>
        <span className="self-center text-xs text-neutral-400 sm:ml-auto">{rows ? `${filtered.length} of ${rows.length}` : ""}</span>
      </div>
      {rows === null ? <div className="px-4"><Spinner label="Loading vehicles…"/></div> : filtered.length === 0 ?
        <div className="px-6 py-16 text-center"><p className="text-neutral-600">{count.length ? "No vehicles match those filters." : "Your inventory is ready for its first vehicle."}</p><p className="mt-1 text-sm text-neutral-400">Add a vehicle to start building your stock register.</p>{!count.length && <Button className="mt-4" onClick={() => setEditing(blank())}>Add first vehicle</Button>}</div> :
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs uppercase tracking-wider text-neutral-400"><th className="px-4 py-3 font-medium">Vehicle</th><th className="px-4 py-3 font-medium">Stock no. / VIN</th><th className="hidden px-4 py-3 font-medium sm:table-cell">Category</th><th className="hidden px-4 py-3 text-right font-medium xl:table-cell">Landed cost</th><th className="px-4 py-3 font-medium">Status</th><th className="hidden px-4 py-3 font-medium md:table-cell">Mileage</th><th className="hidden px-4 py-3 font-medium lg:table-cell">Location</th><th className="px-4 py-3"/></tr></thead><tbody className="divide-y divide-neutral-100">{filtered.map(v => <tr key={v.id} className="hover:bg-neutral-50"><td className="min-w-48 px-4 py-3"><div className="font-semibold">{[v.year,v.make,v.model,v.trim].filter(Boolean).join(" ")}</div><div className="mt-0.5 text-xs text-neutral-500">{[v.colour,v.transmission].filter(Boolean).join(" · ") || "Details not added"}</div></td><td className="px-4 py-3"><div className="font-medium">{v.stockNo || "—"}</div><div className="max-w-40 truncate text-xs text-neutral-500" title={v.vin}>{v.vin || "No VIN"}</div></td><td className="hidden px-4 py-3 sm:table-cell">{CATEGORY_LABEL[v.category]}</td><td className="hidden whitespace-nowrap px-4 py-3 text-right tabular-nums xl:table-cell">{v.purchaseAmount || v.additionalCosts?.length ? `${totalLandedCost(v).toLocaleString(undefined,{maximumFractionDigits:2})} ${v.reportingCurrency || "USD"}` : "—"}</td><td className="px-4 py-3"><Badge status={v.status}/></td><td className="hidden px-4 py-3 md:table-cell">{v.mileage ? `${Number(v.mileage).toLocaleString()} km` : "—"}</td><td className="hidden px-4 py-3 lg:table-cell">{v.location || "—"}</td><td className="whitespace-nowrap px-4 py-3 text-right"><button onClick={() => setEditing({...v})} className="rounded-md px-2 py-1 text-neutral-600 hover:bg-neutral-100">Edit</button><button onClick={() => void remove(v)} className="rounded-md px-2 py-1 text-red-600 hover:bg-red-50">Remove</button></td></tr>)}</tbody></table></div>}
    </Card>

    {editing && <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-3 sm:items-center sm:p-6" onMouseDown={e => { if (e.target === e.currentTarget && !saving) setEditing(null); }}>
      <div className="my-3 w-full max-w-3xl rounded-2xl bg-white shadow-2xl sm:my-8"><div className="flex items-start justify-between border-b border-neutral-100 px-5 py-4 sm:px-6"><div><h2 className="text-lg font-bold">{rows?.some(v => v.id === editing.id) ? "Edit vehicle" : "Add vehicle"}</h2><p className="text-sm text-neutral-500">Maintain stock, acquisition, and cost details for this vehicle.</p></div><button aria-label="Close form" onClick={() => setEditing(null)} className="rounded-lg px-3 py-1 text-xl text-neutral-400 hover:bg-neutral-100">×</button></div>
      <form onSubmit={save} className="max-h-[75vh] overflow-y-auto px-5 py-5 sm:px-6">
        <SectionTitle>Stock identity</SectionTitle><div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><Field label="Stock number"><Input value={editing.stockNo} onChange={e => setEditing({...editing,stockNo:e.target.value})} placeholder="e.g. MA-001"/></Field><Field label="Category"><Select value={editing.category} onChange={e => setEditing({...editing,category:e.target.value as VehicleCategory})}>{Object.entries(CATEGORY_LABEL).map(([k,v])=><option key={k} value={k}>{v}</option>)}</Select></Field><Field label="Status"><Select value={editing.status} onChange={e => setEditing({...editing,status:e.target.value as VehicleStatus})}>{Object.entries(STATUS_LABEL).map(([k,v])=><option key={k} value={k}>{v}</option>)}</Select></Field></div>
        <SectionTitle>Vehicle details</SectionTitle><div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><Field label="Make *"><Input required value={editing.make} onChange={e => setEditing({...editing,make:e.target.value})} placeholder="Toyota"/></Field><Field label="Model *"><Input required value={editing.model} onChange={e => setEditing({...editing,model:e.target.value})} placeholder="Camry"/></Field><Field label="Year"><Input inputMode="numeric" value={editing.year} onChange={e => setEditing({...editing,year:e.target.value})} placeholder="2024"/></Field><Field label="Trim / grade"><Input value={editing.trim} onChange={e => setEditing({...editing,trim:e.target.value})} placeholder="XLE, Sport…"/></Field><Field label="Colour"><Input value={editing.colour} onChange={e => setEditing({...editing,colour:e.target.value})}/></Field><Field label="Condition"><Select value={editing.condition} onChange={e => setEditing({...editing,condition:e.target.value})}><option value="">Select condition</option><option>Excellent</option><option>Very good</option><option>Good</option><option>Fair</option><option>Needs work</option></Select></Field><Field label="Mileage (km)"><Input inputMode="numeric" value={editing.mileage} onChange={e => setEditing({...editing,mileage:e.target.value.replace(/[^0-9]/g,"")})} placeholder="e.g. 52,000"/></Field><Field label="Transmission"><Select value={editing.transmission} onChange={e => setEditing({...editing,transmission:e.target.value})}><option value="">Select</option><option>Automatic</option><option>Manual</option><option>CVT</option><option>Other</option></Select></Field><Field label="Fuel type"><Select value={editing.fuelType} onChange={e => setEditing({...editing,fuelType:e.target.value})}><option value="">Select</option><option>Petrol</option><option>Diesel</option><option>Hybrid</option><option>Electric</option><option>Other</option></Select></Field><Field label="VIN / chassis number"><Input value={editing.vin} onChange={e => setEditing({...editing,vin:e.target.value.toUpperCase()})}/></Field><Field label="Engine number"><Input value={editing.engineNumber} onChange={e => setEditing({...editing,engineNumber:e.target.value.toUpperCase()})}/></Field><Field label="Stock location"><Input value={editing.location} onChange={e => setEditing({...editing,location:e.target.value})} placeholder="Yard, branch, port…"/></Field></div>
        <SectionTitle>Acquisition &amp; landed cost</SectionTitle>
        <p className="mb-3 text-xs text-neutral-500">Keep original amounts and record the exchange rate used to convert each cost into the vehicle's reporting currency. Rates are stored as entered for an auditable estimate, not fetched automatically.</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Supplier / source"><Input value={editing.supplier || ""} onChange={e => setEditing({...editing,supplier:e.target.value})} placeholder="Auction, dealer, customer…"/></Field>
          <Field label="Acquisition date"><Input type="date" value={editing.acquisitionDate || ""} onChange={e => setEditing({...editing,acquisitionDate:e.target.value})}/></Field>
          <Field label="Reporting currency"><Select value={editing.reportingCurrency || "USD"} onChange={e => setEditing({...editing,reportingCurrency:e.target.value as StockVehicle["reportingCurrency"]})}>{CURRENCIES.map(c=><option key={c.code} value={c.code}>{c.code} — {c.label}</option>)}</Select></Field>
          <Field label="Purchase amount"><Input type="number" min="0" step="0.01" value={editing.purchaseAmount || ""} onChange={e => setEditing({...editing,purchaseAmount:Number(e.target.value)})} placeholder="0.00"/></Field>
          <Field label="Purchase currency"><Select value={editing.purchaseCurrency || "USD"} onChange={e => setEditing({...editing,purchaseCurrency:e.target.value as StockVehicle["purchaseCurrency"]})}>{CURRENCIES.map(c=><option key={c.code} value={c.code}>{c.code}</option>)}</Select></Field>
          <Field label={`Rate to ${editing.reportingCurrency || "USD"}`} hint="Enter 1 if same currency"><Input type="number" min="0.00000001" step="any" value={editing.purchaseRateToBase ?? 1} onChange={e => setEditing({...editing,purchaseRateToBase:Number(e.target.value)})}/></Field>
        </div>
        <div className="mt-4 rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3"><div><h4 className="text-sm font-semibold">Additional costs</h4><p className="text-xs text-neutral-500">Shipping, clearing, duties, repairs, preparation, and other costs.</p></div><Button type="button" variant="secondary" className="px-3 py-1.5" onClick={() => setEditing({...editing,additionalCosts:[...(editing.additionalCosts || []),{id:crypto.randomUUID(),label:"",amount:0,currency:editing.reportingCurrency || "USD",rateToBase:1,date:""}]})}>+ Add cost</Button></div>
          <div className="space-y-3 p-4">
            {(editing.additionalCosts || []).length === 0 && <p className="text-sm text-neutral-400">No additional costs recorded yet.</p>}
            {(editing.additionalCosts || []).map((cost,index) => <div key={cost.id} className="grid grid-cols-2 gap-3 rounded-lg bg-neutral-50 p-3 sm:grid-cols-6">
              <Field label="Cost type" className="col-span-2 sm:col-span-2"><Input value={cost.label} placeholder="Freight, duty…" onChange={e => updateCost(editing,setEditing,index,{label:e.target.value})}/></Field>
              <Field label="Amount"><Input type="number" min="0" step="0.01" value={cost.amount || ""} onChange={e => updateCost(editing,setEditing,index,{amount:Number(e.target.value)})}/></Field>
              <Field label="Currency"><Select value={cost.currency} onChange={e => updateCost(editing,setEditing,index,{currency:e.target.value as VehicleCost["currency"]})}>{CURRENCIES.map(c=><option key={c.code} value={c.code}>{c.code}</option>)}</Select></Field>
              <Field label={`Rate to ${editing.reportingCurrency || "USD"}`} hint="1 if same"><Input type="number" min="0.00000001" step="any" value={cost.rateToBase} onChange={e => updateCost(editing,setEditing,index,{rateToBase:Number(e.target.value)})}/></Field>
              <div className="flex items-end justify-end"><button type="button" onClick={() => setEditing({...editing,additionalCosts:(editing.additionalCosts || []).filter((_,i)=>i!==index)})} className="mb-1 rounded-md px-2 py-2 text-xs font-medium text-red-600 hover:bg-red-50">Remove</button></div>
            </div>)}
            <div className="flex justify-between border-t border-neutral-100 pt-3 text-sm"><span className="font-medium text-neutral-600">Estimated total landed cost</span><span className="font-bold tabular-nums">{totalLandedCost({...editing,additionalCosts:editing.additionalCosts || []}).toLocaleString(undefined,{style:"currency",currency:editing.reportingCurrency || "USD"})}</span></div>
          </div>
        </div>
        <SectionTitle>Notes</SectionTitle><Field label="Internal notes"><Textarea rows={3} value={editing.notes} onChange={e => setEditing({...editing,notes:e.target.value})} placeholder="Vehicle history, import notes, known issues…"/></Field>
        <div className="mt-6 flex flex-col-reverse gap-2 border-t border-neutral-100 pt-4 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save vehicle"}</Button></div>
      </form></div>
    </div>}
  </main>;
}

function Metric({label,value}:{label:string;value:number}){return <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"><div className="text-xs font-medium uppercase tracking-wider text-neutral-500">{label}</div><div className="mt-1 text-2xl font-bold tabular-nums">{value}</div></div>}
function SectionTitle({children}:{children:string}){return <h3 className="mb-3 mt-5 border-b border-neutral-100 pb-2 text-xs font-bold uppercase tracking-widest text-neutral-500 first:mt-0">{children}</h3>}
function Badge({status}:{status:VehicleStatus}){const cls:Record<VehicleStatus,string>={in_stock:"bg-emerald-50 text-emerald-700 ring-emerald-200",reserved:"bg-amber-50 text-amber-700 ring-amber-200",sold:"bg-neutral-100 text-neutral-600 ring-neutral-200",in_transit:"bg-sky-50 text-sky-700 ring-sky-200",preparation:"bg-violet-50 text-violet-700 ring-violet-200"};return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${cls[status]}`}>{STATUS_LABEL[status]}</span>}

function updateCost(vehicle: StockVehicle, setVehicle: (v: StockVehicle) => void, index: number, patch: Partial<VehicleCost>) {
  const costs = [...(vehicle.additionalCosts || [])]; costs[index] = { ...costs[index], ...patch }; setVehicle({ ...vehicle, additionalCosts: costs });
}
