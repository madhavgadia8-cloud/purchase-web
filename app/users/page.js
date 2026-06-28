import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import AdminShell from "@/app/AdminShell";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/perms";
import UsersManager from "@/app/UsersManager";

export const dynamic = "force-dynamic";

export default async function UsersPage({ searchParams }) {
  const me = await getCurrentUser();
  if (!can(me, "users")) redirect("/?denied=1");

  let users = [];
  let dbError = null;
  try {
    const supabase = db();
    const { data, error } = await supabase
      .from("app_users")
      .select("id,username,role,active,permissions,created_at")
      .order("created_at", { ascending: true });
    if (error) throw error;
    users = (data || []).map((u) => ({
      ...u,
      permissions: Array.isArray(u.permissions) ? u.permissions : [],
    }));
  } catch (e) {
    dbError = e.message;
  }

  const err = searchParams?.e;

  return (
    <AdminShell>
      <h1 className="page-title">Users &amp; roles</h1>
      <p className="page-sub">
        Give each person their own login and tick exactly which actions they can perform.
        Use a preset (Admin / Manager / Employee) or customise.
      </p>

      {err === "dup" ? <div className="err" style={{ marginBottom: 12 }}>That username already exists.</div> : null}
      {err === "missing" ? <div className="err" style={{ marginBottom: 12 }}>Username and password are required.</div> : null}
      {dbError ? <div className="err" style={{ marginBottom: 12 }}>Could not load users: {dbError}</div> : null}

      <UsersManager users={users} />
    </AdminShell>
  );
}
