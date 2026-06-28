import { login } from "@/app/actions";
import Logo from "@/app/Logo";

export default function LoginPage({ searchParams }) {
  const err = searchParams?.e;
  return (
    <div className="wrap">
      <div className="card center">
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
          <Logo size={44} />
        </div>
        <h2 style={{ textAlign: "center" }}>Purchase Manager</h2>
        <p className="muted" style={{ textAlign: "center" }}>Sign in to continue</p>
        <form action={login}>
          <label>Username</label>
          <input name="username" autoFocus placeholder="your username" autoComplete="username" />
          <label style={{ marginTop: 10, display: "block" }}>Password</label>
          <input type="password" name="password" autoComplete="current-password" />
          {err ? <div className="err">Wrong username or password, try again.</div> : null}
          <button className="btn" type="submit" style={{ marginTop: 12, width: "100%" }}>
            Sign in
          </button>
        </form>
        <p className="muted" style={{ marginTop: 14 }}>
          Vendors don&apos;t sign in — they use the quote link you share with them.
        </p>
      </div>
    </div>
  );
}
