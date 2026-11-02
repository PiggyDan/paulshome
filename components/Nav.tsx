"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { LogoLockup } from "./Logo";
import { LangSwitch, ThemeToggle, useLang } from "./Prefs";
import { PHONE, PHONE_HREF } from "@/lib/i18n";

const EASE = [0.22, 1, 0.36, 1] as const;

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
    <motion.header
      className={`nav-wrap${scrolled ? " scrolled" : ""}${open ? " menu-open" : ""}`}
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: EASE }}
    >
      <nav className="nav shell" aria-label="Main navigation">
        <Link className="brand" href="/" aria-label="Paul's Home Repair">
          <LogoLockup />
        </Link>
        <div className="nav-links">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="nav-link">{label}</Link>
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

      <AnimatePresence>
        {open && (
          <motion.div
            className="nav-sheet"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
            transition={{ duration: 0.35, ease: EASE }}
            onClick={() => setOpen(false)}
          >
            {[...links, [PHONE_HREF, PHONE]].map(([href, label], i) => (
              <motion.a
                key={href}
                href={href}
                className={href === PHONE_HREF ? "nav-cta" : ""}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.04 * i, ease: EASE }}
              >
                {label}
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
