import { isSupabaseConfigured } from "../supabase/client";
import { localStore } from "./local";
import { supabaseStore } from "./supabase";
import type { InvoiceStore } from "./types";

export type { InvoiceStore } from "./types";

/** Returns the Supabase store when configured, otherwise the browser-only demo store. */
export function getStore(): InvoiceStore {
  return isSupabaseConfigured() ? supabaseStore : localStore;
}

export function isDemoMode(): boolean {
  return !isSupabaseConfigured();
}
