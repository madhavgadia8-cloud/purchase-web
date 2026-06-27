"use client";

import { useState } from "react";

export default function CopyLink({ url }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be blocked; user can select manually */
    }
  };
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <span className="linkbox" style={{ flex: 1, minWidth: 240 }}>{url}</span>
      <button type="button" className="btn sm" onClick={copy}>
        {copied ? "Copied!" : "Copy link"}
      </button>
      <a className="btn ghost sm" href={url} target="_blank" rel="noreferrer">Open</a>
    </div>
  );
}
