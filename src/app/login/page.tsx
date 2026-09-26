"use client";

import { Alert, Button, Field, Input, LinkButton } from "@/components/ui";
import { isDemoMode } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const demo = isDemoMode();

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setError(error.message === "Invalid login credentials" ? "Incorrect email or password." : error.message);
      return;
    }
    const next = new URLSearchParams(window.location.search).get("next") || "/";
    router.push(next);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center rounded-2xl bg-black p-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="MAI AUTOS" className="h-24 w-auto" />
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          {demo ? (
            <div className="space-y-4 text-center">
              <h1 className="text-lg font-bold">Demo mode</h1>
              <p className="text-sm text-neutral-600">
                Supabase is not connected, so no login is needed. Invoices are stored in this browser only.
              </p>
              <LinkButton href="/">Open the app</LinkButton>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <h1 className="text-lg font-bold">Staff sign in</h1>
                <p className="text-sm text-neutral-500">Sign in to manage invoices.</p>
              </div>
              {error && <Alert>{error}</Alert>}
              <Field label="Email">
                <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <Field label="Password">
                <Input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Signing in…" : "Sign in"}
              </Button>
              <p className="text-center text-xs text-neutral-400">
                Accounts are created by the administrator in the Supabase dashboard.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
