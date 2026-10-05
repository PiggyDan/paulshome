"use client";

import { createContext, useContext, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Lang } from "@/lib/catalog";
import { DICT, type Dict } from "@/lib/i18n";
import Icon from "./Icon";

type Ctx = { lang: Lang; t: Dict; setLang: (l: Lang) => void };

const LangContext = createContext<Ctx>({ lang: "en", t: DICT.en, setLang: () => {} });

const YEAR = 60 * 60 * 24 * 365;

export function PrefsProvider({ lang: initial, children }: { lang: Lang; children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initial);
  const router = useRouter();
  const [, startTransition] = useTransition();

  const setLang = (l: Lang) => {
    document.cookie = `lang=${l}; path=/; max-age=${YEAR}; samesite=lax`;
    document.documentElement.lang = l;
    setLangState(l);
    // Server-rendered parts (services, headings) re-render in the new language.
    startTransition(() => router.refresh());
  };

  return <LangContext.Provider value={{ lang, t: DICT[lang], setLang }}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);

export function LangSwitch() {
  const { lang, setLang, t } = useLang();
  return (
    <div className="lang-switch" role="group" aria-label={t.nav.lang}>
      <button className={lang === "en" ? "on" : ""} aria-pressed={lang === "en"} onClick={() => setLang("en")}>EN</button>
      <button className={lang === "mn" ? "on" : ""} aria-pressed={lang === "mn"} onClick={() => setLang("mn")}>МН</button>
    </div>
  );
}

export function ThemeToggle() {
  const { t } = useLang();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const attr = document.documentElement.dataset.theme;
    setDark(attr ? attr === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, []);

  const toggle = () => {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    document.cookie = `theme=${next}; path=/; max-age=${YEAR}; samesite=lax`;
    setDark(!dark);
  };

  return (
    <button className="theme-btn" onClick={toggle} aria-label={t.nav.theme} title={t.nav.theme}>
      <Icon name={dark ? "sun" : "moon"} size={18} />
    </button>
  );
}
