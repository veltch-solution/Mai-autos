"use client";

import { computeTotals, lineAmount, vehicleLabel } from "@/lib/calc";
import { formatDate, formatMoney } from "@/lib/format";
import type { Invoice, Settings } from "@/lib/types";
import type { CSSProperties, ReactNode } from "react";

/* Small typographic helpers (sizes in pt so screen preview == print) */
const heading: CSSProperties = { fontSize: "8.5pt", fontWeight: 700, letterSpacing: "0.08em", color: "#000" };
const label: CSSProperties = { fontSize: "7pt", letterSpacing: "0.05em", color: "#666", textTransform: "uppercase" };
const body: CSSProperties = { fontSize: "9.5pt", color: "#1a1a1a" };
const bodyBold: CSSProperties = { fontSize: "9.5pt", fontWeight: 700, color: "#000" };

export default function InvoiceSheet({
  invoice: inv,
  settings: s,
  mode = "preview",
}: {
  invoice: Invoice;
  settings: Settings;
  mode?: "preview" | "print";
}) {
  const t = computeTotals(inv);
  const cur = inv.currency;
  const isPreview = mode === "preview";

  /** Show a grey hint in the live preview when a field is empty; print nothing when printing. */
  const ph = (value: string | undefined, hint: string): ReactNode => {
    if (value && value.trim()) return value;
    return isPreview ? <span style={{ color: "#b3b3b3" }}>{hint}</span> : null;
  };

  const vehicle = vehicleLabel(inv.vehicle);
  const terms = (inv.terms || "").split("\n").map((x) => x.trim()).filter(Boolean);
  const items = inv.items.length ? inv.items : [{ id: "empty", description: "", qty: 0, unitPrice: 0 }];
  const showDiscount = t.discount > 0;
  const showVat = (Number(inv.vatRate) || 0) > 0;
  const showPaid = t.amountPaid > 0;

  const vehicleCells: [string, ReactNode][] = [
    ["Vehicle", ph(vehicle, "Year  Make  Model")],
    ["VIN / Chassis No.", ph(inv.vehicle.vin, "VIN")],
    ["Colour", ph(inv.vehicle.colour, "Colour")],
    ["Mileage", ph(inv.vehicle.mileage, "Mileage")],
    [
      "Engine / Transmission",
      ph([inv.vehicle.engine, inv.vehicle.transmission].filter(Boolean).join("  /  "), "Engine  /  Transmission"),
    ],
    ["Stock / Lot No.", ph(inv.vehicle.stockNo, "Stock No.")],
  ];

  return (
    <div className="sheet">
      {/* ---------------------------------------------------------- header */}
      <div className="flex items-center justify-between bg-black text-white" style={{ padding: "7px 10px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt={s.companyName} style={{ height: "20mm", width: "auto" }} />
        <div className="text-right">
          <div className="serif font-bold" style={{ fontSize: "28pt", lineHeight: 1.1, letterSpacing: "0.03em" }}>
            INVOICE
          </div>
          <MetaRow label="Invoice No." value={inv.number} />
          <MetaRow label="Invoice Date" value={formatDate(inv.issueDate)} />
          <MetaRow label="Due Date" value={formatDate(inv.dueDate)} />
          <MetaRow label="Payment Terms" value={inv.paymentTerms} />
        </div>
      </div>

      {/* ------------------------------------------------ from / bill to */}
      <div className="grid grid-cols-2 gap-6" style={{ marginTop: "5mm" }}>
        <div>
          <div style={heading}>FROM</div>
          <div className="serif" style={{ fontSize: "13pt", fontWeight: 700, color: "#000", marginTop: "3px" }}>
            {s.companyName}
          </div>
          <div style={{ fontSize: "7.5pt", letterSpacing: "0.15em", color: "#666", marginBottom: "3px" }}>{s.tagline}</div>
          <div style={body}>{s.address}</div>
          {s.phone && <div style={body}>{s.phone}</div>}
          {s.email && <div style={body}>{s.email}</div>}
        </div>
        <div>
          <div style={heading}>BILL TO</div>
          <div style={{ fontSize: "11pt", fontWeight: 700, color: "#000", marginTop: "3px" }}>
            {ph(inv.customer.name, "Customer / Company Name")}
          </div>
          <div style={body}>{ph(inv.customer.address, "Street Address")}</div>
          <div style={body}>{ph(inv.customer.city, "City, State")}</div>
          <div style={body}>{ph(inv.customer.phone, "Phone Number")}</div>
          <div style={body}>{ph(inv.customer.email, "Email Address")}</div>
        </div>
      </div>

      {/* ------------------------------------------------ vehicle details */}
      <div style={{ marginTop: "5mm" }}>
        <div style={{ ...heading, marginBottom: "3px" }}>VEHICLE DETAILS</div>
        <div className="grid grid-cols-3" style={{ gap: "1.5px" }}>
          {vehicleCells.map(([k, v]) => (
            <div key={k} style={{ background: "#f2f2f2", padding: "4px 7px 5px" }}>
              <div style={label}>{k}</div>
              <div style={bodyBold}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------ line items */}
      <table style={{ marginTop: "5mm" }}>
        <thead>
          <tr style={{ background: "#000", color: "#fff", fontSize: "8pt", letterSpacing: "0.06em" }}>
            <th style={{ ...th, width: "10mm", textAlign: "center" }}>#</th>
            <th style={{ ...th, textAlign: "left" }}>DESCRIPTION</th>
            <th style={{ ...th, width: "15mm", textAlign: "center" }}>QTY</th>
            <th style={{ ...th, width: "30mm", textAlign: "right" }}>UNIT PRICE</th>
            <th style={{ ...th, width: "30mm", textAlign: "right" }}>AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={it.id} style={{ borderBottom: "0.5pt solid #bfbfbf" }}>
              <td style={{ ...td, textAlign: "center", color: "#666" }}>{i + 1}</td>
              <td style={td}>{ph(it.description, "Description")}</td>
              <td style={{ ...td, textAlign: "center" }}>{it.qty || ""}</td>
              <td style={{ ...td, textAlign: "right" }}>{formatMoney(Number(it.unitPrice) || 0, cur)}</td>
              <td style={{ ...td, textAlign: "right" }}>{formatMoney(lineAmount(it.qty, it.unitPrice), cur)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ------------------------------------- payment details | totals */}
      <div className="grid" style={{ gridTemplateColumns: "92mm 1fr", marginTop: "4mm" }}>
        <div style={{ paddingRight: "15px", paddingTop: "2px" }}>
          <div style={{ ...heading, marginBottom: "4px" }}>PAYMENT DETAILS</div>
          {(
            [
              ["Bank Name", ph(s.bankName, "Bank Name")],
              ["Account Name", ph(s.accountName, "Account Name")],
              ["Account Number", ph(s.accountNumber, "Account Number")],
              ["Payment Reference", `Invoice No. ${inv.number}`],
            ] as [string, ReactNode][]
          )
            .filter(([, v]) => v !== null) /* hide empty rows when printing */
            .map(([k, v]) => (
              <PayRow key={k} k={k} v={v} />
            ))}
        </div>
        <div className="flex justify-end">
          <table style={{ width: "85mm" }}>
            <tbody>
              <TotalRow k="Subtotal" v={formatMoney(t.subtotal, cur)} />
              {showDiscount && <TotalRow k="Discount" v={"-" + formatMoney(t.discount, cur)} />}
              {showVat && <TotalRow k={`VAT (${inv.vatRate}%)`} v={formatMoney(t.vat, cur)} />}
              <TotalRow k="TOTAL" v={formatMoney(t.total, cur)} strong />
              {showPaid && <TotalRow k="Amount Paid / Deposit" v={formatMoney(t.amountPaid, cur)} />}
              <TotalRow k="BALANCE DUE" v={formatMoney(t.balance, cur)} strong dark />
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------- notes */}
      {inv.notes?.trim() && (
        <div style={{ marginTop: "5mm" }}>
          <div style={{ ...heading, marginBottom: "3px" }}>NOTES</div>
          <div style={{ fontSize: "8.5pt", whiteSpace: "pre-wrap" }}>{inv.notes}</div>
        </div>
      )}

      {/* ------------------------------------------------------- terms */}
      {terms.length > 0 && (
        <div style={{ marginTop: "5mm" }}>
          <div style={{ ...heading, marginBottom: "3px" }}>TERMS &amp; CONDITIONS</div>
          <ol style={{ listStyle: "decimal outside", fontSize: "8.5pt", lineHeight: 1.35, paddingLeft: "14px", margin: 0 }}>
            {terms.map((term, i) => (
              <li key={i} style={{ paddingLeft: "2px", marginBottom: "2px" }}>
                {term}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* --------------------------------------------------- signatures */}
      <div className="avoid-break grid" style={{ gridTemplateColumns: "75mm 30mm 75mm", marginTop: "9mm" }}>
        <SignatureBlock who={`Authorized Signature – ${s.companyName}`} />
        <div />
        <SignatureBlock who="Customer Signature" />
      </div>

      <div className="serif" style={{ textAlign: "center", fontStyle: "italic", fontSize: "10.5pt", marginTop: "8mm", color: "#000" }}>
        {s.thankYou}
      </div>

      {/* -------------------------------------------------------- footer */}
      <div className="sheet-footer">
        {[s.companyName, titleCase(s.tagline), s.address, s.phone, s.email].filter(Boolean).join("  ·  ")}
      </div>
    </div>
  );
}

const th: CSSProperties = { padding: "5px 5px", fontWeight: 700 };
const td: CSSProperties = { padding: "5px 5px", fontSize: "9.5pt", verticalAlign: "middle" };

function MetaRow({ label: k, value }: { label: string; value: string }) {
  return (
    <div style={{ fontSize: "8.5pt", lineHeight: 1.45 }}>
      <span style={{ color: "#bbb" }}>{k}:&nbsp;&nbsp;</span>
      <span style={{ fontSize: "9pt", fontWeight: 700 }}>{value || "—"}</span>
    </div>
  );
}

function PayRow({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div style={{ marginBottom: "4px" }}>
      <div style={label}>{k}</div>
      <div style={bodyBold}>{v}</div>
    </div>
  );
}

function TotalRow({ k, v, strong = false, dark = false }: { k: string; v: string; strong?: boolean; dark?: boolean }) {
  const bg = dark ? "#000" : strong ? "#f2f2f2" : "transparent";
  const color = dark ? "#fff" : strong ? "#000" : undefined;
  const base: CSSProperties = {
    padding: strong ? "5px 5px 5px 6px" : "3.5px 5px 3.5px 6px",
    textAlign: "right",
    background: bg,
    borderBottom: strong ? "none" : "0.5pt solid #bfbfbf",
  };
  return (
    <tr>
      <td style={{ ...base, width: "50mm", fontSize: strong ? "10pt" : "9.5pt", fontWeight: strong ? 700 : 400, color: color ?? "#666" }}>{k}</td>
      <td style={{ ...base, fontSize: strong ? "11pt" : "9.5pt", fontWeight: strong ? 700 : 400, color: color ?? "#1a1a1a" }}>{v}</td>
    </tr>
  );
}

function SignatureBlock({ who }: { who: string }) {
  return (
    <div>
      <div style={{ borderBottom: "0.75pt solid #000", height: "9mm" }} />
      <div style={{ fontSize: "8pt", fontWeight: 700, marginTop: "3px", color: "#000" }}>{who}</div>
      <div style={{ fontSize: "8pt", color: "#666", marginTop: "3px" }}>
        Name: ______________________ &nbsp;&nbsp;&nbsp; Date: ____________
      </div>
    </div>
  );
}

function titleCase(s: string) {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
