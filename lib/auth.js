import crypto from "crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

const COOKIE = "pm_auth";

// ---- Password hashing (scrypt) ----
export function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(pw), salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(pw, stored) {
  if (!stored || !String(stored).includes(":")) return false;
  const [salt, hash] = String(stored).split(":");
  const h = crypto.scryptSync(String(pw), salt, 64).toString("hex");
  const a = Buffer.from(h, "hex");
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ---- Session cookie ----
export function setSession(value) {
  cookies().set(COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}
export function clearSession() {
  cookies().delete(COOKIE);
}

// ---- Current user resolution ----
// Cookie value is "env" (built-in admin via ADMIN_PASSWORD) or an app_users id.
export async function getCurrentUser() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  if (token === "env") return { id: null, name: "Admin", role: "admin", builtin: true };
  try {
    const supabase = db();
    const { data } = await supabase
      .from("app_users")
      .select("id,username,role,active")
      .eq("id", token)
      .single();
    if (!data || data.active === false) return null;
    return { id: data.id, name: data.username, role: data.role || "viewer" };
  } catch {
    return null;
  }
}

export async function isAdmin() {
  const u = await getCurrentUser();
  return !!u && u.role === "admin";
}

// ---- Activity log ----
export async function logActivity(actor, action, detail) {
  try {
    const supabase = db();
    await supabase.from("activity_log").insert({
      actor: actor || "—",
      action: String(action || "").slice(0, 200),
      detail: detail ? String(detail).slice(0, 500) : null,
    });
  } catch {
    // never let logging break the main action
  }
}
