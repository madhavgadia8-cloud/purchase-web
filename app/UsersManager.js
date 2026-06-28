"use client";

import { useState } from "react";
import { PERMISSIONS, PRESETS, roleLabel } from "@/lib/perms";
import { createUser, updateUserPermissions, updateUserContact, resetUserPassword, deleteUser } from "@/app/actions";

function PresetButtons({ onPick }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
      <span className="muted" style={{ fontSize: 12, alignSelf: "center" }}>Quick preset:</span>
      <button type="button" className="btn ghost sm" onClick={() => onPick("admin")}>Admin</button>
      <button type="button" className="btn ghost sm" onClick={() => onPick("manager")}>Manager</button>
      <button type="button" className="btn ghost sm" onClick={() => onPick("employee")}>Employee</button>
    </div>
  );
}

function PermChecks({ selected, toggle }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px", margin: "4px 0 10px" }}>
      {PERMISSIONS.map((p) => (
        <label key={p.key} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, fontWeight: 400 }}>
          <input type="checkbox" name="perm" value={p.key}
                 checked={selected.includes(p.key)} onChange={() => toggle(p.key)} />
          {p.label}
        </label>
      ))}
    </div>
  );
}

function AddUser() {
  const [perms, setPerms] = useState(PRESETS.employee);
  const toggle = (k) => setPerms((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));
  return (
    <form action={createUser}>
      <div className="row">
        <div><label>Username *</label><input name="username" required autoComplete="off" /></div>
        <div><label>Password *</label><input name="password" type="text" required autoComplete="off" placeholder="set a password" /></div>
      </div>
      <div className="row" style={{ marginTop: 10 }}>
        <div><label>Mobile (for OTP login)</label><input name="phone" placeholder="e.g. 9413654477" autoComplete="off" /></div>
        <div><label>Email (OTP fallback)</label><input name="email" placeholder="optional" autoComplete="off" /></div>
      </div>
      <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
        If an email (or mobile) is set, this user signs in with password <strong>and</strong> a one-time code (2-step) — the code is emailed automatically.
      </div>
      <label style={{ display: "block", marginTop: 12 }}>Rights ({roleLabel(perms)})</label>
      <PresetButtons onPick={(name) => setPerms(PRESETS[name])} />
      <PermChecks selected={perms} toggle={toggle} />
      <button className="btn" type="submit">Add user</button>
    </form>
  );
}

function UserRow({ u }) {
  const [editing, setEditing] = useState(false);
  const [perms, setPerms] = useState(u.permissions || []);
  const toggle = (k) => setPerms((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));

  return (
    <div className="listitem" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <div>
          <strong>{u.username}</strong>{" "}
          <span className="pill grey" style={{ marginLeft: 6 }}>{roleLabel(u.permissions)}</span>
          {(u.phone || u.email) ? <span className="pill green" style={{ marginLeft: 6 }}>2-step</span> : null}
          <div className="muted" style={{ fontSize: 12 }}>
            {(u.permissions || []).length} right(s){u.phone ? ` · 📱 ${u.phone}` : ""}{u.email ? ` · ✉ ${u.email}` : ""}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button type="button" className="btn ghost sm" onClick={() => setEditing((e) => !e)}>
            {editing ? "Close" : "Edit"}
          </button>
          <form action={deleteUser}>
            <input type="hidden" name="id" value={u.id} />
            <button className="btn danger sm" type="submit">Delete</button>
          </form>
        </div>
      </div>

      {editing ? (
        <div style={{ borderTop: "1px solid var(--line, #eee)", paddingTop: 10 }}>
          <form action={updateUserContact} style={{ marginBottom: 12 }}>
            <input type="hidden" name="id" value={u.id} />
            <div className="row">
              <div><label>Mobile (OTP)</label><input name="phone" defaultValue={u.phone || ""} placeholder="enable 2-step login" /></div>
              <div><label>Email (OTP fallback)</label><input name="email" defaultValue={u.email || ""} /></div>
            </div>
            <button className="btn sm" type="submit" style={{ marginTop: 8 }}>Save contact</button>
          </form>

          <form action={updateUserPermissions}>
            <input type="hidden" name="id" value={u.id} />
            <label style={{ display: "block" }}>Rights ({roleLabel(perms)})</label>
            <PresetButtons onPick={(name) => setPerms(PRESETS[name])} />
            <PermChecks selected={perms} toggle={toggle} />
            <button className="btn sm" type="submit">Save rights</button>
          </form>

          <form action={resetUserPassword} style={{ display: "flex", gap: 6, marginTop: 10, alignItems: "center" }}>
            <input type="hidden" name="id" value={u.id} />
            <input name="password" type="text" placeholder="new password" style={{ width: 160 }} />
            <button className="btn ghost sm" type="submit">Reset password</button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

export default function UsersManager({ users = [] }) {
  return (
    <>
      <div className="card">
        <h2>Add a user</h2>
        <AddUser />
      </div>

      <div className="card">
        <h2>All users ({users.length})</h2>
        {users.length === 0 ? (
          <div className="empty">No named users yet. The built-in admin password still works for sign-in.</div>
        ) : (
          users.map((u) => <UserRow key={u.id} u={u} />)
        )}
        <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
          Tip: the built-in admin sign-in (username <strong>admin</strong> + the master password) always works and skips OTP, so you can never get locked out.
        </p>
      </div>
    </>
  );
}
