import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { PrefsProvider } from "@/components/Prefs";
import { getLang, getTheme } from "@/lib/prefs";
import "./globals.css";

// cyrillic-ext carries the Mongolian letters Ө and Ү.
const inter = Inter({ subsets: ["latin", "cyrillic", "cyrillic-ext"], display: "swap" });

export const metadata: Metadata = {
  title: "Paul's Home Repair | Ulaanbaatar",
  description:
    "Home repairs, renovation, carpentry and maintenance in Ulaanbaatar, Mongolia. Free quotes. Serving homeowners since 2014.",
  applicationName: "Paul's Home Repair",
  appleWebApp: { capable: true, title: "Paul's Repair", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0e1317",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const lang = getLang();
  return (
    <html lang={lang} data-theme={getTheme()}>
      <body className={inter.className}>
        <PrefsProvider lang={lang}>{children}</PrefsProvider>
      </body>
    </html>
  );
}
