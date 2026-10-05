"use client";

import { useEffect, useState } from "react";
import Icon from "./Icon";
import { LogoMark } from "./Logo";
import { useLang } from "./Prefs";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const KEY = "phr-install-dismissed";

/** "Add to home screen" card for phones. Uses the native prompt on Android; shows Share-menu steps on iPhone. */
export default function InstallPrompt() {
  const { t } = useLang();
  const [evt, setEvt] = useState<InstallEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try { dismissed = localStorage.getItem(KEY) === "1"; } catch {}
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone;
    const mobile = window.matchMedia("(max-width: 760px)").matches;
    if (dismissed || standalone || !mobile) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as InstallEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    let timer: ReturnType<typeof setTimeout> | undefined;
    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
      setIos(true);
      timer = setTimeout(() => setShow(true), 4000);
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const dismiss = () => {
    setShow(false);
    try { localStorage.setItem(KEY, "1"); } catch {}
  };

  const install = async () => {
    if (!evt) return;
    await evt.prompt();
    await evt.userChoice;
    dismiss();
  };

  if (!show) return null;

  return (
    <div className="install-card" role="dialog" aria-label="Install app">
      <LogoMark size={44} />
      <div>
        <strong>{t.install.title}</strong>
        <span>
          {ios ? t.install.ios : t.install.android}
        </span>
      </div>
      {!ios && <button className="install-btn" onClick={install}>{t.install.button}</button>}
      <button className="install-close" onClick={dismiss} aria-label={t.install.dismiss}><Icon name="close" size={18} /></button>
    </div>
  );
}
