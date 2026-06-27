import Logo from "@/app/Logo";

export default function Thanks() {
  return (
    <>
      <div className="topbar">
        <Logo size={34} />
        <h1 style={{ marginLeft: 6 }}>Request for Quotation</h1>
      </div>
      <div className="wrap">
        <div className="card center" style={{ textAlign: "center" }}>
          <h2>Thank you</h2>
          <p className="muted">Your quote has been submitted. You can close this page.</p>
        </div>
      </div>
    </>
  );
}
