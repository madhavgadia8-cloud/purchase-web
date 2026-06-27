import { login } from "@/app/actions";

export default function LoginPage({ searchParams }) {
  const err = searchParams?.e;
  return (
    <div className="wrap">
      <div className="card center">
        <h2>📦 Purchase Manager</h2>
        <p className="muted">Admin sign-in</p>
        <form action={login}>
          <label>Password</label>
          <input type="password" name="password" autoFocus />
          {err ? <div className="err">Wrong password, try again.</div> : null}
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
