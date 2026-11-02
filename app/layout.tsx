import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { PrefsProvider } from "@/components/Prefs";
import MotionProvider from "@/components/motion/MotionProvider";
import { getLang, getTheme } from "@/lib/prefs";
import "./globals.css";

// cyrillic-ext carries the Mongolian letters Ө and Ү.
const sans = Manrope({ subsets: ["latin", "cyrillic", "cyrillic-ext"], display: "swap", variable: "--font-sans" });
const display = Cormorant_Garamond({ subsets: ["latin", "cyrillic", "cyrillic-ext"], weight: ["400", "500", "600"], style: ["normal", "italic"], display: "swap", variable: "--font-display" });

export const metadata: Metadata = {
  title: "Paul's Home Repair | Ulaanbaatar",
  description:
    "Home repairs, renovation, carpentry and maintenance in Ulaanbaatar, Mongolia. Free quotes. Serving homeowners since 2014.",
  applicationName: "Paul's Home Repair",
  appleWebApp: { capable: true, title: "Paul's Repair", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#1c1b19",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const lang = getLang();
  return (
    <html lang={lang} data-theme={getTheme()} className={`${sans.variable} ${display.variable}`}>
      <body>
        <PrefsProvider lang={lang}>
          <MotionProvider>{children}</MotionProvider>
        </PrefsProvider>
      </body>
    </html>
  );
}
