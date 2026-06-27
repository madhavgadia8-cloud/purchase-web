import Sidebar from "@/app/Sidebar";

export default function AdminShell({ children }) {
  return (
    <div className="shell">
      <Sidebar />
      <div className="content">{children}</div>
    </div>
  );
}
