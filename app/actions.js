"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  getCurrentUser,
  logActivity,
  hashPassword,
  verifyPassword,
  setSession,
  clearSession,
} from "@/lib/auth";

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
  );
}

// Require an admin for write actions. Returns the user, or redirects viewers away.
async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/?denied=1");
  return user;
}

/* ---------------- Auth ---------------- */
export async function login(formData) {
  const username = (formData.get("username") || "").trim();
  const pw = formData.get("password") || "";
  const supabase = db();

  // 1) Named app user
  if (username) {
    const { data: u } = await supabase
      .from("app_users")
      .select("*")
      .eq("username", username)
      .eq("active", true)
      .maybeSingle();
    if (u && verifyPassword(pw, u.password_hash)) {
      setSession(u.id);
      await logActivity(u.username, "Signed in", `Role: ${u.role}`);
      redirect("/");
    }
  }

  // 2) Built-in admin via ADMIN_PASSWORD (username blank or "admin")
  if ((!username || username.toLowerCase() === "admin") && pw && pw === process.env.ADMIN_PASSWORD) {
    setSession("env");
    await logActivity("Admin", "Signed in", "Built-in admin");
    redirect("/");
  }

  redirect("/login?e=1");
}

export async function logout() {
  const user = await getCurrentUser();
  await logActivity(user?.name || "—", "Signed out", null);
  clearSession();
  redirect("/login");
}

/* ---------------- Requirements (RFQ) ---------------- */
export async function createRfq(formData) {
  const me = await requireAdmin();
  const title = (formData.get("title") || "").trim();
  if (!title) redirect("/requirements?e=title");
  const required_by = formData.get("required_by") || null;
  const notes = (formData.get("notes") || "").trim() || null;
  const descs = formData.getAll("desc");
  const qtys = formData.getAll("qty");
  const units = formData.getAll("unit");

  const supabase = db();
  const { data: rfq, error } = await supabase
    .from("rfqs")
    .insert({ title, required_by, notes })
    .select()
    .single();
  if (error) throw new Error(error.message);

  const items = [];
  for (let i = 0; i < descs.length; i++) {
    const d = (descs[i] || "").trim();
    if (!d) continue;
    items.push({
      rfq_id: rfq.id,
      description: d,
      qty: Number(qtys[i] || 0) || 0,
      unit: (units[i] || "").trim(),
      sort: i,
    });
  }
  if (items.length) {
    const { error: e2 } = await supabase.from("rfq_items").insert(items);
    if (e2) throw new Error(e2.message);
  }
  await logActivity(me.name, "Created requirement", `${title} (${items.length} item(s))`);
  redirect("/rfq/" + rfq.id);
}

export async function deleteRfq(formData) {
  const me = await requireAdmin();
  const id = formData.get("id");
  const supabase = db();
  const { data: rfq } = await supabase.from("rfqs").select("title").eq("id", id).maybeSingle();
  await supabase.from("rfqs").delete().eq("id", id);
  await logActivity(me.name, "Deleted requirement", rfq?.title || id);
  revalidatePath("/requirements");
  redirect("/requirements");
}

/* ---------------- Products ---------------- */
export async function createProduct(formData) {
  const me = await requireAdmin();
  const name = (formData.get("name") || "").trim();
  if (!name) redirect("/products?e=name");
  const supabase = db();
  const { error } = await supabase.from("products").insert({
    name,
    code: (formData.get("code") || "").trim() || null,
    unit: (formData.get("unit") || "").trim() || null,
    category: (formData.get("category") || "").trim() || null,
    notes: (formData.get("notes") || "").trim() || null,
  });
  if (error) throw new Error(error.message);
  await logActivity(me.name, "Added product", name);
  revalidatePath("/products");
  redirect("/products");
}

export async function deleteProduct(formData) {
  const me = await requireAdmin();
  const id = formData.get("id");
  const supabase = db();
  const { data: p } = await supabase.from("products").select("name").eq("id", id).maybeSingle();
  await supabase.from("products").delete().eq("id", id);
  await logActivity(me.name, "Deleted product", p?.name || id);
  revalidatePath("/products");
  redirect("/products");
}

/* ---------------- Suppliers ---------------- */
export async function createSupplier(formData) {
  const me = await requireAdmin();
  const name = (formData.get("name") || "").trim();
  if (!name) redirect("/suppliers?e=name");
  const supabase = db();
  const { error } = await supabase.from("suppliers").insert({
    name,
    contact_person: (formData.get("contact_person") || "").trim() || null,
    email: (formData.get("email") || "").trim() || null,
    phone: (formData.get("phone") || "").trim() || null,
    category: (formData.get("category") || "").trim() || null,
  });
  if (error) throw new Error(error.message);
  await logActivity(me.name, "Added supplier", name);
  revalidatePath("/suppliers");
  redirect("/suppliers");
}

export async function updateSupplier(formData) {
  const me = await requireAdmin();
  const id = formData.get("id");
  const name = (formData.get("name") || "").trim();
  if (!id || !name) redirect("/suppliers?e=name");
  const supabase = db();
  const { error } = await supabase
    .from("suppliers")
    .update({
      name,
      contact_person: (formData.get("contact_person") || "").trim() || null,
      email: (formData.get("email") || "").trim() || null,
      phone: (formData.get("phone") || "").trim() || null,
      category: (formData.get("category") || "").trim() || null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  await logActivity(me.name, "Edited supplier", name);
  revalidatePath("/suppliers");
  redirect("/suppliers");
}

export async function deleteSupplier(formData) {
  const me = await requireAdmin();
  const id = formData.get("id");
  const supabase = db();
  const { data: s } = await supabase.from("suppliers").select("name").eq("id", id).maybeSingle();
  await supabase.from("suppliers").delete().eq("id", id);
  await logActivity(me.name, "Deleted supplier", s?.name || id);
  revalidatePath("/suppliers");
  redirect("/suppliers");
}

/* ---------------- Quotes ---------------- */
export async function deleteQuote(formData) {
  const me = await requireAdmin();
  const quoteId = formData.get("quote_id");
  const rfqId = formData.get("rfq_id");
  const supabase = db();
  const { data: q } = await supabase.from("quotes").select("vendor_name").eq("id", quoteId).maybeSingle();
  await supabase.from("quote_lines").delete().eq("quote_id", quoteId);
  await supabase.from("quotes").delete().eq("id", quoteId);
  await logActivity(me.name, "Deleted quote", q?.vendor_name || quoteId);
  revalidatePath(`/rfq/${rfqId}`);
  redirect(`/rfq/${rfqId}`);
}

/* ---------------- Send RFQ by email ---------------- */
export async function sendRfqEmail(formData) {
  const me = await requireAdmin();
  const rfqId = formData.get("rfq_id");
  const to = (formData.get("to") || "").trim();
  if (!to) redirect(`/rfq/${rfqId}?sent=noemail`);

  const supabase = db();
  const { data: rfq } = await supabase.from("rfqs").select("*").eq("id", rfqId).single();
  if (!rfq) redirect(`/rfq/${rfqId}?sent=err`);
  const { data: items = [] } = await supabase
    .from("rfq_items").select("*").eq("rfq_id", rfqId).order("sort");

  const h = headers();
  const proto = h.get("x-forwarded-proto") || "https";
  const host = h.get("host");
  const link = `${proto}://${host}/quote/${rfqId}`;

  const rows = (items || []).map((it, i) =>
    `<tr>
      <td style="padding:6px 10px;border:1px solid #e5e7eb">${i + 1}</td>
      <td style="padding:6px 10px;border:1px solid #e5e7eb">${escapeHtml(it.description)}</td>
      <td style="padding:6px 10px;border:1px solid #e5e7eb;text-align:right">${Number(it.qty)}</td>
      <td style="padding:6px 10px;border:1px solid #e5e7eb">${escapeHtml(it.unit || "")}</td>
    </tr>`
  ).join("");

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;max-width:640px;margin:auto">
    <h2 style="color:#F7941E;margin:0 0 4px">Request for Quotation</h2>
    <p style="margin:0 0 14px;color:#6b7280">Kalpana Industries — Engineered Power Solutions</p>
    <p><strong>${escapeHtml(rfq.title)}</strong>${rfq.required_by ? ` &middot; required by ${escapeHtml(rfq.required_by)}` : ""}</p>
    ${rfq.notes ? `<p style="color:#374151">${escapeHtml(rfq.notes)}</p>` : ""}
    <table style="border-collapse:collapse;width:100%;font-size:14px;margin:12px 0">
      <thead><tr style="background:#f4f5f7">
        <th style="padding:6px 10px;border:1px solid #e5e7eb;text-align:left">#</th>
        <th style="padding:6px 10px;border:1px solid #e5e7eb;text-align:left">Description</th>
        <th style="padding:6px 10px;border:1px solid #e5e7eb;text-align:right">Qty</th>
        <th style="padding:6px 10px;border:1px solid #e5e7eb;text-align:left">Unit</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin:18px 0">
      <a href="${link}" style="background:#F7941E;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold;display:inline-block">
        Submit your quotation
      </a>
    </p>
    <p style="color:#6b7280;font-size:13px">Please use the button above to submit your quotation online. Reference: ${escapeHtml(rfqId)}</p>
  </div>`;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RFQ_FROM;
  if (!apiKey || !from) redirect(`/rfq/${rfqId}?sent=config`);

  let ok = true;
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const sendOpts = {
      from,
      to,
      subject: `Request for Quotation: ${rfq.title} [Ref ${rfqId}]`,
      html,
    };
    const replyTo =
      process.env.REPLY_TO_ADDRESS ||
      (process.env.REPLY_DOMAIN ? `rfq+${rfqId}@${process.env.REPLY_DOMAIN}` : null);
    if (replyTo) sendOpts.replyTo = replyTo;
    const { error } = await resend.emails.send(sendOpts);
    if (error) ok = false;
  } catch (e) {
    ok = false;
  }
  if (ok) await logActivity(me.name, "Sent RFQ email", `${rfq.title} → ${to}`);
  redirect(`/rfq/${rfqId}?sent=${ok ? "1" : "fail"}&to=${encodeURIComponent(to)}`);
}

/* ---------------- Public vendor quote submission ---------------- */
export async function submitQuote(formData) {
  const rfqId = formData.get("rfq_id");
  const vendor = (formData.get("vendor_name") || "").trim();
  const contact = (formData.get("vendor_contact") || "").trim();
  const notes = (formData.get("notes") || "").trim() || null;
  if (!vendor) redirect("/quote/" + rfqId + "?e=name");

  const supabase = db();
  const { data: q, error } = await supabase
    .from("quotes")
    .insert({ rfq_id: rfqId, vendor_name: vendor, vendor_contact: contact, notes })
    .select()
    .single();
  if (error) throw new Error(error.message);

  // optional file upload (spec / vendor's own quotation)
  const file = formData.get("attachment");
  if (file && typeof file === "object" && file.size > 0) {
    try {
      const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = rfqId + "/" + q.id + "." + (ext || "bin");
      const bytes = Buffer.from(await file.arrayBuffer());
      const { error: upErr } = await supabase.storage
        .from("quotes")
        .upload(path, bytes, { contentType: file.type || "application/octet-stream", upsert: true });
      if (!upErr) {
        const { data: pub } = supabase.storage.from("quotes").getPublicUrl(path);
        await supabase.from("quotes").update({ attachment_url: pub.publicUrl }).eq("id", q.id);
      }
    } catch (e) {
      // ignore upload failure; quote still saved
    }
  }

  const itemIds = formData.getAll("item_id");
  const rates = formData.getAll("rate");
  const lines = [];
  for (let i = 0; i < itemIds.length; i++) {
    const r = parseFloat(rates[i]);
    if (isNaN(r)) continue;
    lines.push({ quote_id: q.id, item_id: itemIds[i], rate: r });
  }
  if (lines.length) {
    const { error: e2 } = await supabase.from("quote_lines").insert(lines);
    if (e2) throw new Error(e2.message);
  }
  await logActivity(`Vendor: ${vendor}`, "Submitted quote (link)", null);
  redirect("/quote/" + rfqId + "/thanks");
}

/* ---------------- Phase 2: approve / reject AI email drafts ---------------- */
export async function approveInbound(formData) {
  const me = await requireAdmin();
  const id = formData.get("inbound_id");
  const rfqId = formData.get("rfq_id");
  const supabase = db();
  const { data: ib } = await supabase.from("inbound_quotes").select("*").eq("id", id).single();
  if (!ib) redirect(`/rfq/${rfqId}`);

  const vendor = (formData.get("vendor_name") || ib.from_email || "Email vendor").trim();
  const { data: q, error } = await supabase
    .from("quotes")
    .insert({ rfq_id: rfqId, vendor_name: vendor, vendor_contact: ib.from_email, notes: "Imported from email reply" })
    .select()
    .single();
  if (error) throw new Error(error.message);

  const itemIds = formData.getAll("item_id");
  const rates = formData.getAll("rate");
  const lines = [];
  for (let i = 0; i < itemIds.length; i++) {
    const r = parseFloat(rates[i]);
    if (isNaN(r)) continue;
    lines.push({ quote_id: q.id, item_id: itemIds[i], rate: r });
  }
  if (lines.length) await supabase.from("quote_lines").insert(lines);
  await supabase.from("inbound_quotes").update({ status: "approved" }).eq("id", id);
  await logActivity(me.name, "Approved email quote", vendor);
  redirect(`/rfq/${rfqId}`);
}

export async function rejectInbound(formData) {
  const me = await requireAdmin();
  const id = formData.get("inbound_id");
  const rfqId = formData.get("rfq_id");
  const supabase = db();
  await supabase.from("inbound_quotes").update({ status: "rejected" }).eq("id", id);
  await logActivity(me.name, "Rejected email quote", null);
  redirect(`/rfq/${rfqId}`);
}

/* ---------------- Manual quote entry (phone / WhatsApp / email) ---------------- */
export async function addManualQuote(formData) {
  const me = await requireAdmin();
  const rfqId = formData.get("rfq_id");
  const vendor = (formData.get("vendor_name") || "").trim();
  if (!vendor) redirect(`/rfq/${rfqId}?mq=name`);
  const contact = (formData.get("vendor_contact") || "").trim();
  const notes = (formData.get("notes") || "").trim() || null;
  const supabase = db();
  const { data: q, error } = await supabase
    .from("quotes")
    .insert({ rfq_id: rfqId, vendor_name: vendor, vendor_contact: contact, notes })
    .select()
    .single();
  if (error) throw new Error(error.message);
  const itemIds = formData.getAll("item_id");
  const rates = formData.getAll("rate");
  const lines = [];
  for (let i = 0; i < itemIds.length; i++) {
    const r = parseFloat(rates[i]);
    if (isNaN(r)) continue;
    lines.push({ quote_id: q.id, item_id: itemIds[i], rate: r });
  }
  if (lines.length) await supabase.from("quote_lines").insert(lines);
  await logActivity(me.name, "Added manual quote", vendor);
  redirect(`/rfq/${rfqId}`);
}

/* ---------------- User management (admin only) ---------------- */
export async function createUser(formData) {
  const me = await requireAdmin();
  const username = (formData.get("username") || "").trim();
  const password = formData.get("password") || "";
  const role = (formData.get("role") || "viewer").trim() === "admin" ? "admin" : "viewer";
  if (!username || !password) redirect("/users?e=missing");
  const supabase = db();
  const { error } = await supabase.from("app_users").insert({
    username,
    password_hash: hashPassword(password),
    role,
    active: true,
  });
  if (error) {
    redirect("/users?e=dup");
  }
  await logActivity(me.name, "Created user", `${username} (${role})`);
  redirect("/users");
}

export async function updateUserRole(formData) {
  const me = await requireAdmin();
  const id = formData.get("id");
  const role = (formData.get("role") || "viewer").trim() === "admin" ? "admin" : "viewer";
  const supabase = db();
  const { data: u } = await supabase.from("app_users").update({ role }).eq("id", id).select().maybeSingle();
  await logActivity(me.name, "Changed user role", `${u?.username || id} → ${role}`);
  redirect("/users");
}

export async function resetUserPassword(formData) {
  const me = await requireAdmin();
  const id = formData.get("id");
  const password = formData.get("password") || "";
  if (!password) redirect("/users?e=missing");
  const supabase = db();
  const { data: u } = await supabase
    .from("app_users")
    .update({ password_hash: hashPassword(password) })
    .eq("id", id)
    .select()
    .maybeSingle();
  await logActivity(me.name, "Reset password", u?.username || id);
  redirect("/users");
}

export async function deleteUser(formData) {
  const me = await requireAdmin();
  const id = formData.get("id");
  const supabase = db();
  const { data: u } = await supabase.from("app_users").select("username").eq("id", id).maybeSingle();
  await supabase.from("app_users").delete().eq("id", id);
  await logActivity(me.name, "Deleted user", u?.username || id);
  redirect("/users");
}
