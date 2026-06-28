import { redirect } from "next/navigation";
import { db, fmtDate } from "@/lib/db";
import AdminShell from "@/app/AdminShell";
import { getCurrentUser } from "@/lib/auth";
import { createUser, updateUserRole, resetUserPassword, deleteUser } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function UsersPage({ searchParams }) {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") redirect("/?denied=1");

  let users = [];
  let dbError = null;
  try {
    const supabase = db();
    const { data, error } = await supabase
      .from("app_users")
      .select("id,username,role,active,created_at")
      .order("created_at", { ascending: true });
    if (error) throw error;
    users = data || [];
  } catch (e) {
    dbError = e.message;
  }

  const err = searchParams?.e;

  return (
    <AdminShell>
      <h1 className="page-title">Users &amp; roles</h1>
      <p className="page-sub">
        <strong>Admin</strong> can do everything. <strong>Viewer</strong> can only view (no create, edit, delete).
      </p>

      <div className="card">
        <h2>Add a user</h2>
        {err === "dup" ? <div className="err">That username already exists.</div> : null}
        {err === "missing" ? <div className="err">Username and password are required.</div> : null}
        <form action={createUser}>
          <div className="row">
            <div><label>Username *</label><input name="username" required autoComplete="off" /></div>
            <div><label>Password *</label><input name="password" type="text" required autoComplete="off" placeholder="set a password" /></div>
            <div>
              <label>Role</label>
              <select name="role" defaultValue="viewer">
                <option value="viewer">Viewer (read-only)</option>
                <option value="admin">Admin (full control)</option>
              </select>
            </div>
          </div>
          <button className="btn" type="submit" style={{ marginTop: 12 }}>Add user</button>
        </form>
      </div>

      <div className="card">
        <h2>All users ({users.length})</h2>
        {dbError ? (
          <p className="muted">Could not load users: {dbError}</p>
        ) : users.length === 0 ? (
          <div className="empty">No named users yet. The built-in admin password still works for sign-in.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr><th>Username</th><th>Role</th><th>Created</th><th>Change role</th><th>Reset password</th><th></th></tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td><strong>{u.username}</strong></td>
                    <td style={{ textTransform: "capitalize" }}>{u.role}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{fmtDate(u.created_at)}</td>
                    <td>
                      <form action={updateUserRole} style={{ display: "flex", gap: 6 }}>
                        <input type="hidden" name="id" value={u.id} />
                        <select name="role" defaultValue={u.role}>
                          <option value="viewer">Viewer</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button className="btn ghost sm" type="submit">Save</button>
                      </form>
                    </td>
                    <td>
                      <form action={resetUserPassword} style={{ display: "flex", gap: 6 }}>
                        <input type="hidden" name="id" value={u.id} />
                        <input name="password" type="text" placeholder="new password" style={{ width: 130 }} />
                        <button className="btn ghost sm" type="submit">Reset</button>
                      </form>
                    </td>
                    <td>
                      <form action={deleteUser}>
                        <input type="hidden" name="id" value={u.id} />
                        <button className="btn danger sm" type="submit">Delete</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
          Tip: the built-in admin sign-in (username <strong>admin</strong> + the master password) always works, so you can never get locked out.
        </p>
      </div>
    </AdminShell>
  );
}
