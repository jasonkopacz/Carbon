import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Carbon grid",
  description: "Grid carbon intensity from Electricity Maps",
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
