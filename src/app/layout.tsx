import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Partnership Hub",
  description: "Centralized partnership management for content approvals and asset tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
