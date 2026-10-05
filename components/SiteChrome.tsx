import Link from "next/link";
import Nav from "./Nav";
import ChatBot from "./ChatBot";
import InstallPrompt from "./InstallPrompt";
import TabBar from "./TabBar";
import { LogoFull } from "./Logo";
import { CATEGORIES, getServices, loc } from "@/lib/store";
import { getLang } from "@/lib/prefs";
import { DICT } from "@/lib/i18n";

/** Header, footer, chat and app tab bar shared by every public page. */
export default async function SiteChrome({ children }: { children: React.ReactNode }) {
  const lang = getLang();
  const t = DICT[lang];
  const titles = (await getServices()).map((s) => loc(s.title, lang));

  return (
    <main>
      <Nav />
      {children}
      <footer>
        <div className="shell footer-brand">
          <LogoFull width={220} />
        </div>
        <div className="shell footer-content">
          <p>© {new Date().getFullYear()} Paul&apos;s Home Repair · {t.footer.location}</p>
          <p>{CATEGORIES.map((c) => loc(c.label, lang)).join(" · ")}</p>
          <Link href="/admin" className="footer-admin">{t.footer.admin}</Link>
        </div>
      </footer>
      <ChatBot serviceTitles={titles} />
      <InstallPrompt />
      <TabBar />
    </main>
  );
}
