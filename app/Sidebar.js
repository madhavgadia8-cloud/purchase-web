"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions";
import Logo from "@/app/Logo";

export default function Sidebar({ user }) {
  const path = usePathname();
  const perms = user?.permissions || [];
  const canUsers = perms.includes("users");
  const isActive = (href) =>
    href === "/" ? path === "/" : path.startsWith(href);

  const items = [
    { href: "/", label: "Dashboard", icon: "📊" },
    { href: "/requirements", label: "Requirements (RFQ)", icon: "📋" },
    { href: "/products", label: "Products", icon: "📦" },
    { href: "/suppliers", label: "Suppliers", icon: "🏭" },
    { href: "/purchase-orders", label: "Purchase Orders", icon: "🧾" },
    { href: "/reports", label: "Reports", icon: "📈" },
    { href: "/activity", label: "Activity log", icon: "🕑" },
  ];
  if (canUsers) items.push({ href: "/users", label: "Users", icon: "👤" });

  return (
    <aside className="sidebar">
      <div className="brand"><Logo size={48} /></div>
      <nav>
        {items.map((it) => (
          <Link key={it.href} href={it.href} className={isActive(it.href) ? "active" : ""}>
            <span>{it.icon}</span>
            <span>{it.label}</span>
          </Link>
        ))}
      </nav>
      <div className="spacer" />
      {user ? (
        <div style={{ padding: "8px 12px", fontSize: 13, color: "#6b7280" }}>
          <div style={{ fontWeight: 600, color: "#374151" }}>{user.name}</div>
          <div style={{ textTransform: "capitalize" }}>{user.role}</div>
        </div>
      ) : null}
      <form className="signout" action={logout}>
        <button type="submit">Sign out</button>
      </form>
    </aside>
  );
}
