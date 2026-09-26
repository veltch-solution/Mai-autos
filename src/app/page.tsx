"use client";

import { Alert, Card, Input, LinkButton, Spinner, StatusBadge } from "@/components/ui";
import { statusOf } from "@/lib/calc";
import { formatDate, formatMoney } from "@/lib/format";
import { getStore, isDemoMode } from "@/lib/store";
import type { InvoiceSummary } from "@/lib/types";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function DashboardPage() {
  const [rows, setRows] = useState<InvoiceSummary[] | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "unpaid" | "paid">("all");

  async function load() {
    try {
      setRows(await getStore().list());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load invoices.");
      setRows([]);
    }
  }
  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      const st = statusOf(r.total, r.balance);
      if (filter === "unpaid" && st === "paid") return false;
      if (filter === "paid" && st !== "paid") return false;
      if (!needle) return true;
      return [r.number, r.customerName, r.vehicle].join(" ").toLowerCase().includes(needle);
    });
  }, [rows, q, filter]);

  const stats = useMemo(() => {
    const all = rows ?? [];
    const paid = all.filter((r) => statusOf(r.total, r.balance) === "paid").length;
    return { total: all.length, paid, open: all.length - paid };
  }, [rows]);

  async function remove(r: InvoiceSummary) {
    if (!confirm(`Delete invoice ${r.number}?`)) return;
    try {
      await getStore().remove(r.id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete.");
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-sm text-neutral-500">Create, print and keep track of your sales invoices.</p>
        </div>
        <LinkButton href="/invoices/new">+ New invoice</LinkButton>
      </div>

      {isDemoMode() && (
        <div className="mb-5">
          <Alert kind="info">
            <b>Demo mode.</b> Supabase is not connected, so invoices are saved in this browser only. Add your Supabase
            keys (see <code>README.md</code>) to store them in your database and turn on login.
          </Alert>
        </div>
      )}
      {error && (
        <div className="mb-5">
          <Alert>{error}</Alert>
        </div>
      )}

      <div className="mb-5 grid grid-cols-3 gap-3">
        <Stat label="Total invoices" value={stats.total} onClick={() => setFilter("all")} active={filter === "all"} />
        <Stat label="Outstanding" value={stats.open} onClick={() => setFilter("unpaid")} active={filter === "unpaid"} />
        <Stat label="Paid" value={stats.paid} onClick={() => setFilter("paid")} active={filter === "paid"} />
      </div>

      <Card className="!p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-neutral-100 p-4">
          <Input
            placeholder="Search by invoice number, customer or vehicle…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-md"
          />
          <span className="ml-auto text-xs text-neutral-400">
            {rows ? `${filtered.length} of ${rows.length}` : ""}
          </span>
        </div>

        {rows === null ? (
          <div className="px-4">
            <Spinner />
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-neutral-500">{rows.length === 0 ? "No invoices yet." : "Nothing matches your search."}</p>
            {rows.length === 0 && (
              <div className="mt-4">
                <LinkButton href="/invoices/new">Create your first invoice</LinkButton>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-neutral-400">
                  <th className="px-4 py-3 font-medium">Invoice</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Vehicle</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">Balance</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((r) => {
                  const st = statusOf(r.total, r.balance);
                  return (
                    <tr key={r.id} className="hover:bg-neutral-50">
                      <td className="whitespace-nowrap px-4 py-3 font-medium">
                        <Link href={`/invoices/${r.id}`} className="hover:underline">
                          {r.number}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-neutral-600">{formatDate(r.issueDate)}</td>
                      <td className="px-4 py-3">{r.customerName || <span className="text-neutral-400">—</span>}</td>
                      <td className="hidden px-4 py-3 text-neutral-600 md:table-cell">{r.vehicle || "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{formatMoney(r.total, r.currency)}</td>
                      <td className="hidden whitespace-nowrap px-4 py-3 text-right tabular-nums sm:table-cell">
                        {formatMoney(r.balance, r.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={st} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <Link href={`/invoices/${r.id}`} className="rounded-md px-2 py-1 text-neutral-600 hover:bg-neutral-100">
                          Open
                        </Link>
                        <Link
                          href={`/invoices/${r.id}/print?auto=1`}
                          className="rounded-md px-2 py-1 text-neutral-600 hover:bg-neutral-100"
                        >
                          Print
                        </Link>
                        <button onClick={() => remove(r)} className="rounded-md px-2 py-1 text-red-600 hover:bg-red-50">
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value, onClick, active }: { label: string; value: number; onClick: () => void; active: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border p-4 text-left shadow-sm transition ${
        active ? "border-black bg-black text-white" : "border-neutral-200 bg-white hover:border-neutral-400"
      }`}
    >
      <div className={`text-xs font-medium uppercase tracking-wider ${active ? "text-neutral-300" : "text-neutral-500"}`}>{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
    </button>
  );
}
