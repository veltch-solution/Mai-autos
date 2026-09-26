"use client";

import Link from "next/link";
import { useEffect, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

export const inputCls =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10 disabled:bg-neutral-50";

export function Card({ title, children, className = "", action }: { title?: string; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={`rounded-xl border border-neutral-200 bg-white p-5 shadow-sm ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Field({ label, children, className = "", hint }: { label: string; children: ReactNode; className?: string; hint?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium text-neutral-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-neutral-400">{hint}</span>}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return <input {...rest} className={`${inputCls} ${className}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = "", ...rest } = props;
  return <select {...rest} className={`${inputCls} ${className}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", ...rest } = props;
  return <textarea {...rest} className={`${inputCls} ${className}`} />;
}

/**
 * Numeric input that keeps its own text while typing (so "0." or "1,500" work)
 * and reports a clean number to the parent.
 */
export function NumInput({
  value,
  onChange,
  className = "",
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
  value: number;
  onChange: (n: number) => void;
}) {
  const [text, setText] = useState<string>(value === 0 ? "" : value.toLocaleString("en-US", { maximumFractionDigits: 4 }));

  useEffect(() => {
    const parsed = parseFloat(text.replace(/,/g, ""));
    const current = Number.isFinite(parsed) ? parsed : 0;
    if (current !== value) setText(value === 0 ? "" : value.toLocaleString("en-US", { maximumFractionDigits: 4 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      {...rest}
      type="text"
      inputMode="decimal"
      value={text}
      onChange={(e) => {
        const t = e.target.value;
        if (!/^[\d,]*\.?\d*$/.test(t)) return;
        setText(t);
        const n = parseFloat(t.replace(/,/g, ""));
        onChange(Number.isFinite(n) ? n : 0);
      }}
      onBlur={() => {
        const n = parseFloat(text.replace(/,/g, ""));
        setText(Number.isFinite(n) && n !== 0 ? n.toLocaleString("en-US", { maximumFractionDigits: 4 }) : "");
      }}
      className={`${inputCls} text-right tabular-nums ${className}`}
    />
  );
}

type Variant = "primary" | "secondary" | "danger" | "ghost";
const variants: Record<Variant, string> = {
  primary: "bg-black text-white hover:bg-neutral-800 disabled:bg-neutral-400",
  secondary: "border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50",
  danger: "border border-red-200 bg-white text-red-600 hover:bg-red-50",
  ghost: "text-neutral-600 hover:bg-neutral-100",
};

export function Button({
  variant = "primary",
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    />
  );
}

export function LinkButton({
  href,
  variant = "primary",
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${variants[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}

export function StatusBadge({ status }: { status: "paid" | "partial" | "unpaid" }) {
  const map = {
    paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    partial: "bg-amber-50 text-amber-700 ring-amber-200",
    unpaid: "bg-neutral-100 text-neutral-700 ring-neutral-200",
  } as const;
  const label = { paid: "Paid", partial: "Part-paid", unpaid: "Unpaid" }[status];
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${map[status]}`}>
      {label}
    </span>
  );
}

export function Alert({ kind = "error", children }: { kind?: "error" | "info" | "success"; children: ReactNode }) {
  const cls = {
    error: "border-red-200 bg-red-50 text-red-700",
    info: "border-sky-200 bg-sky-50 text-sky-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  }[kind];
  return <div className={`rounded-lg border px-4 py-3 text-sm ${cls}`}>{children}</div>;
}

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-16 text-sm text-neutral-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
      {label}
    </div>
  );
}
