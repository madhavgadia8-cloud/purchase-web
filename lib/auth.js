import crypto from "crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { ALL_PERMS } from "@/lib/perms";

const COOKIE = "pm_auth";
const OTP_COOKIE = "pm_otp";

// ---- Password / code hashing (scrypt) ----
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

export function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
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

// ---- Pending-OTP cookie (holds the user id between password and code steps) ----
export function setOtpSession(uid) {
  cookies().set(OTP_COOKIE, uid, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
}
export function getOtpSession() {
  return cookies().get(OTP_COOKIE)?.value || null;
}
export function clearOtpSession() {
  cookies().delete(OTP_COOKIE);
}

// ---- Current user resolution ----
export async function getCurrentUser() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  if (token === "env") {
    return { id: null, name: "Admin", role: "admin", builtin: true, permissions: ALL_PERMS };
  }
  try {
    const supabase = db();
    const { data } = await supabase
      .from("app_users")
      .select("id,username,role,active,permissions")
      .eq("id", token)
      .single();
    if (!data || data.active === false) return null;
    return {
      id: data.id,
      name: data.username,
      role: data.role || "viewer",
      permissions: Array.isArray(data.permissions) ? data.permissions : [],
    };
  } catch {
    return null;
  }
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
