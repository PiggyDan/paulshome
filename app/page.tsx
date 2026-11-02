import Image from "next/image";
import ServiceExplorer from "@/components/ServiceExplorer";
import SiteChrome from "@/components/SiteChrome";
import Icon from "@/components/Icon";
import HouseExperience from "@/components/home/HouseExperience";
import InView, { Unveil } from "@/components/motion/InView";
import { houseCopy } from "@/components/home/copy";
import { CATEGORIES, getServices, loc } from "@/lib/store";
import { getLang } from "@/lib/prefs";
import { DICT, EMAIL, fmt, PHONE, PHONE_HREF } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const PROMISE_ICONS = ["shield", "clock", "star"];
const GALLERY = [
  { src: "porch-angle", cls: "g-tall" },
  { src: "cabin-wide", cls: "g-wide" },
  { src: "interior", cls: "" },
  { src: "porch-front", cls: "" },
  { src: "cabin-side", cls: "" },
  { src: "cabin-rear", cls: "" },
];

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
      <HouseExperience copy={houseCopy(lang)} phone={PHONE} phoneHref={PHONE_HREF} />

      <section id="services" className="section shell">
        <InView className="section-head split">
          <div>
            <p className="kicker">{t.services.kicker}</p>
            <h2>{t.services.h2}</h2>
          </div>
          <div>
            <p className="muted lead">{t.services.sub}</p>
            <ul className="ticks">
              {t.hero.ticks.map((tick) => (
                <li key={tick}><Icon name="check" size={15} /> {fmt(tick, { n: services.length })}</li>
              ))}
            </ul>
          </div>
        </InView>
        <ServiceExplorer services={cards} categories={categories} />
      </section>

      <section id="how" className="section band">
        <div className="shell">
          <InView className="section-head">
            <p className="kicker">{t.how.kicker}</p>
            <h2>{t.how.h2}</h2>
          </InView>
          <ol className="steps">
            {t.how.steps.map(([title, text], i) => (
              <li key={i}>
                <InView delay={i * 0.1}>
                  <span className="step-num">{String(i + 1).padStart(2, "0")}</span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </InView>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="about" className="section shell">
        <div className="about-grid">
          <InView>
            <p className="kicker">{t.about.kicker}</p>
            <h2>{t.about.h2}</h2>
            <p className="muted lead">{t.about.body}</p>
          </InView>
          <div className="promises">
            {t.about.promises.map(([title, text], i) => (
              <InView key={i} className="promise" delay={i * 0.08}>
                <span className="cat-icon small"><Icon name={PROMISE_ICONS[i]} /></span>
                <div><strong>{title}</strong><p>{text}</p></div>
              </InView>
            ))}
          </div>
        </div>

        <div className="gallery">
          {GALLERY.map((g, i) => (
            <Unveil key={g.src} className={`g-item ${g.cls}`} delay={(i % 3) * 0.08}>
              <Image src={`/projects/${g.src}.jpg`} alt={i === 0 ? t.about.photoAlt : ""} fill sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 33vw" />
              {i === 0 && <div className="photo-badge"><strong>12+</strong><span>{t.about.badge}</span></div>}
            </Unveil>
          ))}
        </div>
      </section>

      <section id="contact" className="section quote-section">
        <div className="shell book-cta">
          <InView>
            <p className="kicker">{t.book.kicker}</p>
            <h2>{t.book.h2}</h2>
            <p className="muted lead">{t.book.sub}</p>
            <a className="button button-primary" href="/book"><Icon name="calendar" size={18} /> {t.book.open_cal}</a>
          </InView>
          <InView delay={0.1}>
            <div className="contact-list">
              <a href={PHONE_HREF}><span className="cat-icon small"><Icon name="phone" /></span><span><small>{t.quote.phone}</small>{PHONE}</span></a>
              <a href={`mailto:${EMAIL}`}><span className="cat-icon small"><Icon name="mail" /></span><span><small>{t.quote.email}</small>{EMAIL}</span></a>
              <div><span className="cat-icon small"><Icon name="pin" /></span><span><small>{t.quote.based}</small>{t.quote.address}</span></div>
            </div>
          </InView>
        </div>
      </section>
    </SiteChrome>
  );
}
