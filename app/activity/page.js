import { db, fmtDate } from "@/lib/db";
import AdminShell from "@/app/AdminShell";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  let rows = [];
  let dbError = null;
  try {
    const supabase = db();
    const { data, error } = await supabase
      .from("activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw error;
    rows = data || [];
  } catch (e) {
    dbError = e.message;
  }

  return (
    <AdminShell>
      <h1 className="page-title">Activity log</h1>
      <p className="page-sub">Every key action in the system, newest first.</p>

      <div className="card">
        {dbError ? (
          <p className="muted">Could not load activity: {dbError}</p>
        ) : rows.length === 0 ? (
          <div className="empty">No activity recorded yet.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr><th>When</th><th>Who</th><th>Action</th><th>Details</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td style={{ whiteSpace: "nowrap" }}>{fmtDate(r.created_at, true)}</td>
                    <td><strong>{r.actor || "—"}</strong></td>
                    <td>{r.action}</td>
                    <td className="muted">{r.detail || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
