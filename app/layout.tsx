import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Paul's Home Repair | Ulaanbaatar",
  description:
    "Reliable home repair, renovation and custom woodwork in Ulaanbaatar, Mongolia. Serving homeowners since 2014.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
