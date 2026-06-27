"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions";
import Logo from "@/app/Logo";

const items = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/requirements", label: "Requirements (RFQ)", icon: "📋" },
  { href: "/products", label: "Products", icon: "📦" },
  { href: "/suppliers", label: "Suppliers", icon: "🏭" },
  { href: "/purchase-orders", label: "Purchase Orders", icon: "🧾" },
];

export default function Sidebar() {
  const path = usePathname();
  const isActive = (href) =>
    href === "/" ? path === "/" : path.startsWith(href);
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
      <form className="signout" action={logout}>
        <button type="submit">Sign out</button>
      </form>
    </aside>
  );
}
