// Sends a login OTP code. Tries SMS via MSG91 (when configured), then falls
// back to email via Resend. Returns { channel, ok }.
export async function sendOtpCode({ phone, email, code }) {
  const msg = `Your Kalpana Purchase login code is ${code}. Valid for 5 minutes. Do not share it.`;

  // ---- 1) SMS via MSG91 (set up by the customer) ----
  const authkey = process.env.MSG91_AUTHKEY;
  const digits = String(phone || "").replace(/\D/g, "");
  const mobile = digits.length === 10 ? "91" + digits : digits;
  if (authkey && mobile) {
    try {
      const templateId = process.env.MSG91_TEMPLATE_ID;
      if (templateId) {
        // Flow / DLT template API (template variable should be named "otp")
        const res = await fetch("https://control.msg91.com/api/v5/flow/", {
          method: "POST",
          headers: { authkey, "content-type": "application/json", accept: "application/json" },
          body: JSON.stringify({
            template_id: templateId,
            short_url: "0",
            recipients: [{ mobiles: mobile, otp: code, OTP: code, code: code, var1: code }],
          }),
        });
        if (res.ok) return { channel: "sms", ok: true };
      } else {
        // Plain SMS API (no DLT template)
        const res = await fetch("https://api.msg91.com/api/v2/sendsms", {
          method: "POST",
          headers: { authkey, "content-type": "application/json" },
          body: JSON.stringify({
            sender: process.env.MSG91_SENDER || "KALPNA",
            route: "4",
            country: "91",
            sms: [{ message: msg, to: [mobile] }],
          }),
        });
        if (res.ok) return { channel: "sms", ok: true };
      }
    } catch (e) {
      // fall through to email
    }
  }

  // ---- 2) Email fallback via Resend ----
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RFQ_FROM;
  if (apiKey && from && email) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(apiKey);
      const { error } = await resend.emails.send({
        from,
        to: email,
        subject: `Your login code: ${code}`,
        html: `<div style="font-family:Arial,sans-serif">
          <p>Your Kalpana Purchase login code is:</p>
          <p style="font-size:26px;font-weight:bold;letter-spacing:3px;color:#F7941E">${code}</p>
          <p style="color:#6b7280">Valid for 5 minutes. Do not share it with anyone.</p>
        </div>`,
      });
      if (!error) return { channel: "email", ok: true };
    } catch (e) {
      // fall through
    }
  }

  return { channel: "none", ok: false };
}
