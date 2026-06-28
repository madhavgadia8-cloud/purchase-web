import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client using the service-role key.
// Created lazily so a missing env var never breaks the build.
export function db() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.");
  }
  return createClient(url, key, {
    auth: { persistSession: false },
    // Bypass Next.js fetch/Data Cache so reads are always live (no stale quotes).
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}

// Format a date/timestamp as dd/mm/yyyy (optionally with HH:MM).
export function fmtDate(d, withTime = false) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return String(d);
  const pad = (n) => String(n).padStart(2, "0");
  const date = `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()}`;
  if (!withTime) return date;
  return `${date} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

export function money(n) {
  const v = Number(n);
  return (isFinite(v) ? v : 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
