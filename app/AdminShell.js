import Sidebar from "@/app/Sidebar";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminShell({ children }) {
  const user = await getCurrentUser();
  const safe = user
    ? { name: user.name, role: user.role, permissions: user.permissions || [] }
    : null;
  return (
    <div className="shell">
      <Sidebar user={safe} />
      <div className="content">{children}</div>
    </div>
  );
}
