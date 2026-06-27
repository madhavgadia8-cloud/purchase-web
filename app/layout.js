import "./globals.css";

export const metadata = {
  title: "Purchase Manager",
  description: "Collect vendor quotes and award the lowest price per item.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
