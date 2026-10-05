import Image from "next/image";
import ServiceExplorer from "@/components/ServiceExplorer";
import Reveal from "@/components/Reveal";
import SiteChrome from "@/components/SiteChrome";
import Icon from "@/components/Icon";
import { CATEGORIES, getServices, loc } from "@/lib/store";
import { getLang } from "@/lib/prefs";
import { DICT, EMAIL, fmt, PHONE, PHONE_HREF } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const PROMISE_ICONS = ["shield", "clock", "star"];

export default async function Home() {
  const lang = getLang();
  const t = DICT[lang];
  const services = await getServices();
  const cards = services.map((s) => ({
    slug: s.slug,
    category: s.category,
    title: loc(s.title, lang),
    description: loc(s.description, lang),
  }));
  const categories = CATEGORIES.map((c) => ({ id: c.id, label: loc(c.label, lang), blurb: loc(c.blurb, lang) }));

  return (
    <SiteChrome>
      <Reveal />

      <section id="home" className="hero">
        <div className="hero-glow" aria-hidden="true" />
        <div className="shell hero-grid">
          <div className="hero-text">
            <p className="pill"><i className="dot" /> {t.hero.pill}</p>
            <h1>{t.hero.h1a} <span>{t.hero.h1b}</span></h1>
            <p className="hero-copy">{t.hero.copy}</p>
            <div className="hero-actions">
              <a className="button button-primary" href="/book"><Icon name="calendar" size={18} /> {t.hero.quote}</a>
              <a className="button button-ghost" href={PHONE_HREF}><Icon name="phone" size={18} /> {t.hero.call}</a>
            </div>
            <ul className="hero-ticks">
              {t.hero.ticks.map((tick) => (
                <li key={tick}><Icon name="check" size={16} /> {fmt(tick, { n: services.length })}</li>
              ))}
            </ul>
          </div>

          <div className="hero-panel">
            <p className="panel-title">{t.hero.panel}</p>
            {categories.map((c) => (
              <a key={c.id} href={`#cat-${c.id}`} className="panel-row">
                <span className="cat-icon small"><Icon name={c.id} /></span>
                <span><strong>{c.label}</strong><small>{c.blurb}</small></span>
                <Icon name="arrow" size={16} />
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="services" className="section shell">
        <div className="section-head reveal">
          <p className="kicker">{t.services.kicker}</p>
          <h2>{t.services.h2}</h2>
          <p className="muted">{t.services.sub}</p>
        </div>
        <div className="reveal">
          <ServiceExplorer services={cards} categories={categories} />
        </div>
      </section>

      <section id="how" className="section band">
        <div className="shell">
          <div className="section-head reveal">
            <p className="kicker">{t.how.kicker}</p>
            <h2>{t.how.h2}</h2>
          </div>
          <ol className="steps">
            {t.how.steps.map(([title, text], i) => (
              <li key={i} className="reveal" style={{ transitionDelay: `${i * 90}ms` }}>
                <span className="step-num">{i + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="about" className="section shell about-grid">
        <div className="about-photo reveal">
          <Image src="/projects/porch-angle.jpg" alt={t.about.photoAlt} fill sizes="(max-width: 900px) 100vw, 45vw" />
          <div className="photo-badge"><strong>12+</strong><span>{t.about.badge}</span></div>
        </div>
        <div className="reveal">
          <p className="kicker">{t.about.kicker}</p>
          <h2>{t.about.h2}</h2>
          <p className="muted lead">{t.about.body}</p>
          <div className="promises">
            {t.about.promises.map(([title, text], i) => (
              <div key={i} className="promise">
                <span className="cat-icon small"><Icon name={PROMISE_ICONS[i]} /></span>
                <div><strong>{title}</strong><p>{text}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="section quote-section">
        <div className="shell book-cta">
          <div className="reveal">
            <p className="kicker">{t.book.kicker}</p>
            <h2>{t.book.h2}</h2>
            <p className="muted lead">{t.book.sub}</p>
            <a className="button button-primary" href="/book"><Icon name="calendar" size={18} /> {t.book.open_cal}</a>
          </div>
          <div className="reveal">
            <div className="contact-list">
              <a href={PHONE_HREF}><span className="cat-icon small"><Icon name="phone" /></span><span><small>{t.quote.phone}</small>{PHONE}</span></a>
              <a href={`mailto:${EMAIL}`}><span className="cat-icon small"><Icon name="mail" /></span><span><small>{t.quote.email}</small>{EMAIL}</span></a>
              <div><span className="cat-icon small"><Icon name="pin" /></span><span><small>{t.quote.based}</small>{t.quote.address}</span></div>
            </div>
          </div>
        </div>
      </section>
    </SiteChrome>
  );
}
