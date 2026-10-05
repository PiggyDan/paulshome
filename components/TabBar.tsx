"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Icon from "./Icon";
import { useLang } from "./Prefs";
import { PHONE_HREF } from "@/lib/i18n";

const TABS = [
  { id: "home", key: "home", icon: "renovation", href: "/" },
  { id: "services", key: "services", icon: "repairs", href: "/#services" },
  { id: "book", key: "quote", icon: "calendar", href: "/book" },
] as const;

/** App-style bottom navigation, shown on phones only (see .tabbar in globals.css). */
export default function TabBar() {
  const { t } = useLang();
  const pathname = usePathname();
  const router = useRouter();
  const [section, setSection] = useState("home");
  const [unread, setUnread] = useState(0);

  // Badge for new replies from Paul (sent by ChatBot).
  useEffect(() => {
    const onUnread = (e: Event) => setUnread((e as CustomEvent<number>).detail);
    window.addEventListener("chat-unread", onUnread);
    return () => window.removeEventListener("chat-unread", onUnread);
  }, []);

  // On the home page, highlight Home or Services depending on scroll position.
  useEffect(() => {
    if (pathname !== "/") return;
    const sections = ["home", "services", "how", "about", "contact"]
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) setSection(e.target.id === "home" ? "home" : "services");
      }),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [pathname]);

  const active =
    pathname === "/book" ? "book" : pathname.startsWith("/services") ? "services" : pathname === "/" ? section : "";

  const go = (tab: (typeof TABS)[number]) => {
    if (navigator.vibrate) navigator.vibrate(8);
    const el = pathname === "/" && tab.id !== "book" ? document.getElementById(tab.id) : null;
    if (el) el.scrollIntoView({ behavior: "smooth" });
    else router.push(tab.href);
  };

  return (
    <nav className="tabbar" aria-label="App navigation">
      {TABS.map((tab) => (
        <button key={tab.id} className={active === tab.id ? "on" : ""} onClick={() => go(tab)} aria-current={active === tab.id ? "page" : undefined}>
          <Icon name={tab.icon} size={22} />
          <span>{t.tabs[tab.key]}</span>
        </button>
      ))}
      <button onClick={() => window.dispatchEvent(new Event("open-chat"))}>
        <span className="tab-icon"><Icon name="chat" size={22} />{unread > 0 && <i className="unread-dot">{unread}</i>}</span>
        <span>{t.tabs.chat}</span>
      </button>
      <a href={PHONE_HREF} className="tab-call">
        <span className="tab-call-btn"><Icon name="phone" size={22} /></span>
        <span>{t.tabs.call}</span>
      </a>
    </nav>
  );
}
