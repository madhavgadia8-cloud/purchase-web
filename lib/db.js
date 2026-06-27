import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client using the service-role key.
// Created lazily so a missing env var never breaks the build.
export function db() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export function money(n) {
  const v = Number(n);
  return (isFinite(v) ? v : 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
