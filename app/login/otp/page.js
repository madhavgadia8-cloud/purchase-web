import { redirect } from "next/navigation";
import { getOtpSession } from "@/lib/auth";
import { verifyOtp, resendOtp } from "@/app/actions";
import Logo from "@/app/Logo";

export const dynamic = "force-dynamic";

export default function OtpPage({ searchParams }) {
  const pending = getOtpSession();
  if (!pending) redirect("/login");

  const ch = searchParams?.ch;
  const chText =
    ch === "sms" ? "an SMS to your phone" : ch === "email" ? "an email" : "a message";

  return (
    <div className="wrap">
      <div className="card center">
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
          <Logo size={44} />
        </div>
        <h2 style={{ textAlign: "center" }}>Verify it&apos;s you</h2>
        <p className="muted" style={{ textAlign: "center" }}>
          We sent a 6-digit code via {chText}. Enter it below to continue.
        </p>
        <form action={verifyOtp}>
          <label>One-time code</label>
          <input
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={6}
            placeholder="------"
            style={{ letterSpacing: 6, textAlign: "center", fontSize: 18 }}
          />
          {searchParams?.e ? <div className="err">Wrong or expired code. Try again.</div> : null}
          {searchParams?.resent ? (
            <div className="hint" style={{ background: "#eaf6df", borderColor: "#bfe3a0", color: "#2f6b16" }}>
              A new code has been sent.
            </div>
          ) : null}
          <button className="btn" type="submit" style={{ marginTop: 12, width: "100%" }}>
            Verify &amp; sign in
          </button>
        </form>
        <form action={resendOtp} style={{ marginTop: 10 }}>
          <button className="btn ghost sm" type="submit">Resend code</button>
        </form>
        <p className="muted" style={{ marginTop: 14, fontSize: 12 }}>
          The code expires in 5 minutes.
        </p>
      </div>
    </div>
  );
}
