"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogoLockup } from "./Logo";
import { LangSwitch, ThemeToggle, useLang } from "./Prefs";
import { PHONE, PHONE_HREF } from "@/lib/i18n";

export default function Nav() {
  const { t } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      setOpen(false);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    ["/#services", t.nav.services],
    ["/#how", t.nav.how],
    ["/#about", t.nav.about],
    ["/book", t.nav.quote],
  ];

  return (
    <header className={`nav-wrap${scrolled ? " scrolled" : ""}`}>
      <nav className="nav shell" aria-label="Main navigation">
        <Link className="brand" href="/" aria-label="Paul's Home Repair">
          <LogoLockup />
        </Link>
        <div className={`nav-links${open ? " open" : ""}`} onClick={() => setOpen(false)}>
          {links.map(([href, label]) => (
            <Link key={href} href={href}>{label}</Link>
          ))}
          <a href={PHONE_HREF} className="nav-cta">{PHONE}</a>
        </div>
        <div className="prefs">
          <LangSwitch />
          <ThemeToggle />
        </div>
        <button className="menu-toggle" aria-expanded={open} aria-label={t.nav.menu} onClick={() => setOpen(!open)}>
          <span /><span />
        </button>
      </nav>
    </header>
  );
}
