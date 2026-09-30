"use client";

import { isDemoMode } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Invoices" },
  { href: "/inventory", label: "Inventory" },
  { href: "/invoices/new", label: "New Invoice" },
  { href: "/settings", label: "Settings" },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const demo = isDemoMode();

  // The print page and the login page have no chrome
  if (!pathname || pathname.endsWith("/print") || pathname.startsWith("/login")) return null;

  async function signOut() {
    setBusy(true);
    await getSupabase().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="no-print sticky top-0 z-20 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-14 items-center justify-center overflow-hidden rounded-md bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="MAI AUTOS" className="h-7 w-auto" />
          </span>
          <span className="hidden font-serif text-lg font-bold tracking-wide sm:block">MAI AUTOS</span>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`whitespace-nowrap rounded-lg px-2 py-1.5 text-sm font-medium transition sm:px-3 ${
                  active ? "bg-black text-white" : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {demo ? (
            <span
              className="hidden rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200 md:inline"
              title="Supabase is not connected. Invoices are stored in this browser only."
            >
              Demo mode
            </span>
          ) : (
            <button
              onClick={signOut}
              disabled={busy}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
            >
              Sign out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
