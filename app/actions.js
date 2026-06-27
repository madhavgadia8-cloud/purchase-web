"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function login(formData) {
  const pw = formData.get("password");
  if (pw && pw === process.env.ADMIN_PASSWORD) {
    cookies().set("pm_auth", "ok", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    redirect("/");
  }
  redirect("/login?e=1");
}

export async function logout() {
  cookies().delete("pm_auth");
  redirect("/login");
}

export async function createRfq(formData) {
  const title = (formData.get("title") || "").trim();
  if (!title) redirect("/?e=title");
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
  redirect("/rfq/" + rfq.id);
}

export async function deleteRfq(formData) {
  const id = formData.get("id");
  const supabase = db();
  await supabase.from("rfqs").delete().eq("id", id);
  revalidatePath("/");
  redirect("/");
}

export async function submitQuote(formData) {
  const rfqId = formData.get("rfq_id");
  const vendor = (formData.get("vendor_name") || "").trim();
  const contact = (formData.get("vendor_contact") || "").trim();
  if (!vendor) redirect("/quote/" + rfqId + "?e=name");

  const supabase = db();
  const { data: q, error } = await supabase
    .from("quotes")
    .insert({ rfq_id: rfqId, vendor_name: vendor, vendor_contact: contact })
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
  if (lines.length) {
    const { error: e2 } = await supabase.from("quote_lines").insert(lines);
    if (e2) throw new Error(e2.message);
  }
  redirect("/quote/" + rfqId + "/thanks");
}
