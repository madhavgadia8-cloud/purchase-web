// Shared permission definitions (no server-only imports — safe for client too).

export const PERMISSIONS = [
  { key: "rfq", label: "Create & edit requirements (RFQ)" },
  { key: "quotes", label: "Add & approve quotes" },
  { key: "send", label: "Send RFQs to suppliers (email / WhatsApp)" },
  { key: "suppliers", label: "Manage suppliers" },
  { key: "products", label: "Manage products" },
  { key: "po", label: "Create & edit Purchase Orders" },
  { key: "delete", label: "Delete (requirements, quotes, suppliers, products)" },
  { key: "users", label: "Manage users & roles" },
];

export const ALL_PERMS = PERMISSIONS.map((p) => p.key);

// Quick presets that pre-fill the checkboxes.
export const PRESETS = {
  admin: ALL_PERMS,
  manager: ["rfq", "quotes", "send", "suppliers", "products", "po", "delete"],
  employee: ["rfq", "quotes", "send"],
};

// Given a list of permission keys, return a friendly role label.
export function roleLabel(perms) {
  const set = [...(perms || [])].sort().join(",");
  if (set === [...PRESETS.admin].sort().join(",")) return "Admin";
  if (set === [...PRESETS.manager].sort().join(",")) return "Manager";
  if (set === [...PRESETS.employee].sort().join(",")) return "Employee";
  if ((perms || []).length === 0) return "No access";
  return "Custom";
}

// Does this user have a permission? Built-in admin has everything.
export function can(user, perm) {
  if (!user) return false;
  if (user.builtin) return true;
  return (user.permissions || []).includes(perm);
}
