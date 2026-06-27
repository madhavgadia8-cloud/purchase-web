export default function Logo({ size = 40, showText = true, dark = false }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <svg width={size} height={size} viewBox="0 0 100 100" aria-label="Kalpana Industries">
        <defs>
          <linearGradient id="kalpanaGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F7941E" />
            <stop offset="50%" stopColor="#8DC63F" />
            <stop offset="100%" stopColor="#5BA82A" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="47" fill="url(#kalpanaGrad)" />
        <path d="M57 16 L30 53 H46 L41 84 L72 43 H54 Z" fill="#ffffff" />
      </svg>
      {showText && (
        <span style={{ lineHeight: 1.05 }}>
          <span style={{ fontSize: size * 0.46, fontWeight: 700, letterSpacing: "0.04em", color: "#F7941E" }}>
            KALPANA
          </span>
          <br />
          <span style={{ fontSize: size * 0.27, fontWeight: 700, letterSpacing: "0.22em", color: dark ? "#cbd5e1" : "#58595B" }}>
            INDUSTRIES
          </span>
        </span>
      )}
    </span>
  );
}
