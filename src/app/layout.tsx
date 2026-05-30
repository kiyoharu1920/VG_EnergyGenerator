import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vanguard Energy Generator",
  description: "Energy counter tool for Vanguard TCG.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
