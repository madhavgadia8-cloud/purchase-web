export default function Logo({ size = 44 }) {
  return (
    <img
      src="/logo.png"
      alt="Kalpana Industries"
      style={{ height: size, width: "auto", maxWidth: "100%", display: "block" }}
    />
  );
}
