"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring, useTransform } from "motion/react";
import Icon from "@/components/Icon";
import { captionAt, renovation, STAGES, stageIndex } from "@/components/house/timeline";
import type { HouseCopy } from "./copy";

// three.js only loads in the browser, after the page is interactive.
const Scene = dynamic(() => import("@/components/house/Scene"), { ssr: false });

type Mode = "pending" | "3d" | "fallback";

const EASE = [0.22, 1, 0.36, 1] as const;

function canWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Follows the site theme: the header toggle (data-theme) wins, otherwise the device setting. */
function useNight() {
  const [night, setNight] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const read = () => {
      const attr = document.documentElement.dataset.theme;
      setNight(attr ? attr === "dark" : mq.matches);
    };
    read();
    mq.addEventListener("change", read);
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => { mq.removeEventListener("change", read); mo.disconnect(); };
  }, []);
  return night;
}

/** Splits a line into words that slide up from behind a mask. */
function Words({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    <>
      {text.split(" ").map((w, i) => (
        <Fragment key={`${w}-${i}`}>
          <span className="w">
            <motion.span
              initial={{ y: "110%" }}
              animate={{ y: "0%" }}
              exit={{ y: "-110%", transition: { duration: 0.35, ease: EASE } }}
              transition={{ duration: 0.8, delay: delay + i * 0.045, ease: EASE }}
            >
              {w}
            </motion.span>
          </span>{" "}
        </Fragment>
      ))}
    </>
  );
}

export default function HouseExperience({ copy, phone, phoneHref }: { copy: HouseCopy; phone: string; phoneHref: string }) {
  const ref = useRef<HTMLElement>(null);
  const [mode, setMode] = useState<Mode>("pending");
  const [low, setLow] = useState(false);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(true);
  const [stage, setStage] = useState(0);
  const [caption, setCaption] = useState<string | undefined>();
  const night = useNight();

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const progress = useSpring(scrollYProgress, { stiffness: 70, damping: 22, mass: 0.6, restDelta: 0.00005 });
  const ren = useTransform(progress, renovation);
  const railFill = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const hint = useTransform(scrollYProgress, [0, 0.025], [1, 0]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
    if (reduced || nav.connection?.saveData || !canWebGL()) {
      setMode("fallback");
      return;
    }
    const small = window.matchMedia("(max-width: 760px)").matches;
    setLow(small || (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4);
    setMode("3d");
  }, []);

  // Stop rendering once the house has scrolled out of view.
  useEffect(() => {
    const el = ref.current;
    if (!el || mode !== "3d") return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: "100px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [mode]);

  useMotionValueEvent(progress, "change", (v) => {
    setStage(stageIndex(v));
    setCaption(captionAt(v));
  });

  const goTo = (i: number) => {
    const el = ref.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const span = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + STAGES[i].from * span + (i ? 4 : 0), behavior: "smooth" });
  };

  if (mode === "fallback") return <Fallback copy={copy} phone={phone} phoneHref={phoneHref} />;

  const s = copy.stages[stage];
  const big = stage === 0 || stage === 5;
  const Title = stage === 0 ? "h1" : "h2";
  const cap = caption && copy.captions[caption];

  return (
    <section id="home" ref={ref} className="xp" aria-label={copy.stagesLabel}>
      <div className="xp-sticky">
        <div className={`xp-canvas${ready ? " on" : ""}`}>
          {mode === "3d" && <Scene progress={progress} night={night} low={low} active={active} onReady={() => setReady(true)} />}
        </div>

        <AnimatePresence>
          {mode === "3d" && !ready && (
            <motion.div className="xp-loading" exit={{ opacity: 0, transition: { duration: 0.8 } }}>
              <span>{copy.loading}</span>
              <i />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="xp-scrim" aria-hidden="true" />

        <div className={`xp-copy${big ? " big" : ""}`}>
          <AnimatePresence mode="wait">
            <motion.div key={stage} className="xp-copy-inner" exit={{ opacity: 0, transition: { duration: 0.35 } }}>
              <motion.p className="xp-kicker" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: EASE }}>
                <span>{String(stage + 1).padStart(2, "0")}</span> {s.label}
              </motion.p>
              <Title className="xp-title"><Words text={s.title} delay={0.05} /></Title>
              {s.sub && (
                <motion.p className="xp-sub" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.35, ease: EASE }}>
                  {s.sub}
                </motion.p>
              )}
              {big && (
                <motion.div className="xp-actions" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.5, ease: EASE }}>
                  <a className="button button-primary" href="/book"><Icon name="calendar" size={18} /> {copy.book}</a>
                  <a className="button button-line" href={phoneHref}><Icon name="phone" size={18} /> {phone}</a>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {cap && (
            <motion.p
              key={cap}
              className="xp-caption"
              initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
              transition={{ duration: 0.55, ease: EASE }}
            >
              <i /> {cap}
            </motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {stage === 4 && (
            <motion.div className="xp-ba" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.5, ease: EASE }}>
              <span>{copy.before}</span>
              <span className="xp-ba-track"><motion.i style={{ scaleX: ren }} /></span>
              <span>{copy.after}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <nav className="xp-rail" aria-label={copy.stagesLabel}>
          <span className="xp-rail-line"><motion.i style={{ scaleY: railFill }} /></span>
          {copy.stages.map((st, i) => (
            <button key={st.id} className={i === stage ? "on" : ""} onClick={() => goTo(i)} aria-current={i === stage ? "step" : undefined}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <em>{st.label}</em>
            </button>
          ))}
        </nav>

        <motion.a href="#services" className="xp-hint" style={{ opacity: hint }}>
          <span>{copy.scroll}</span>
          <i />
        </motion.a>
      </div>
    </section>
  );
}

const PHOTOS = ["cabin-wide", "cabin-side", "interior", "porch-front", "porch-angle", "cabin-rear"];

/** Shown without WebGL, with reduced motion, or in data-saver mode: the same story told with Paul's project photos. */
function Fallback({ copy, phone, phoneHref }: { copy: HouseCopy; phone: string; phoneHref: string }) {
  return (
    <section id="home" className="xp-fallback">
      {copy.stages.map((st, i) => {
        const Title = i === 0 ? "h1" : "h2";
        return (
          <motion.article
            key={st.id}
            className={`xpf-stage${i === 0 ? " first" : ""}`}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6 }}
          >
            <div className="xpf-photo">
              <Image src={`/projects/${PHOTOS[i]}.jpg`} alt="" fill sizes="(max-width: 900px) 100vw, 60vw" priority={i === 0} />
            </div>
            <div className="xpf-text">
              <p className="xp-kicker"><span>{String(i + 1).padStart(2, "0")}</span> {st.label}</p>
              <Title className="xp-title">{st.title}</Title>
              {st.sub && <p className="xp-sub">{st.sub}</p>}
              {(i === 0 || i === copy.stages.length - 1) && (
                <div className="xp-actions">
                  <a className="button button-primary" href="/book"><Icon name="calendar" size={18} /> {copy.book}</a>
                  <a className="button button-line" href={phoneHref}><Icon name="phone" size={18} /> {phone}</a>
                </div>
              )}
            </div>
          </motion.article>
        );
      })}
    </section>
  );
}
