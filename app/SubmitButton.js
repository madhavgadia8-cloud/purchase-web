"use client";

import { useFormStatus } from "react-dom";

export default function SubmitButton({ children, className = "btn", pendingText, ...props }) {
  const { pending } = useFormStatus();
  return (
    <button className={className} type="submit" disabled={pending} {...props}>
      {pending ? pendingText || "Saving…" : children}
    </button>
  );
}
