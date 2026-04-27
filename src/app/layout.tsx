import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UniConnect Authentication",
  description: "Secure access for UniConnect users and administrators",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
