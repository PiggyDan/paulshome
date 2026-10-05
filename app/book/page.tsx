import type { Metadata } from "next";
import SiteChrome from "@/components/SiteChrome";
import BookingForm from "@/components/BookingForm";
import Icon from "@/components/Icon";
import { getServices, loc } from "@/lib/store";
import { getLang } from "@/lib/prefs";
import { DICT, EMAIL, PHONE, PHONE_HREF } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const t = DICT[getLang()];
  return { title: `${t.book.kicker} | Paul's Home Repair`, description: t.book.sub };
}

/** Booking page. `?service=<slug>` preselects a service (links from service pages). */
export default async function BookPage({ searchParams }: { searchParams: { service?: string } }) {
  const lang = getLang();
  const t = DICT[lang];
  const services = await getServices();
  const titles = services.map((s) => loc(s.title, lang));
  const preselected = services.find((s) => s.slug === searchParams.service);

  return (
    <SiteChrome>
      <section className="hero detail-hero book-hero">
        <div className="hero-glow" aria-hidden="true" />
        <div className="shell detail-hero-inner">
          <p className="pill"><Icon name="calendar" size={16} /> {t.book.kicker}</p>
          <h1>{t.book.h2}</h1>
          <p className="hero-copy">{t.book.sub}</p>
        </div>
      </section>

      <section className="section shell book-layout">
        <div className="book-main">
          <BookingForm serviceTitles={titles} defaultService={preselected ? loc(preselected.title, lang) : ""} />
        </div>

        <aside className="book-aside">
          <div className="aside-card">
            <h3>{t.detail.howTitle}</h3>
            <ol className="mini-steps">
              {t.how.steps.map(([stepTitle, text], i) => (
                <li key={i}>
                  <span className="step-num">{i + 1}</span>
                  <div><strong>{stepTitle}</strong><p>{text}</p></div>
                </li>
              ))}
            </ol>
          </div>

          <div className="aside-card">
            <h3>{t.book.contactTitle}</h3>
            <p className="muted small">{t.book.contactSub}</p>
            <div className="contact-list light">
              <a href={PHONE_HREF}><span className="cat-icon small"><Icon name="phone" /></span><span><small>{t.quote.phone}</small>{PHONE}</span></a>
              <a href={`mailto:${EMAIL}`}><span className="cat-icon small"><Icon name="mail" /></span><span><small>{t.quote.email}</small>{EMAIL}</span></a>
              <div><span className="cat-icon small"><Icon name="pin" /></span><span><small>{t.quote.based}</small>{t.quote.address}</span></div>
            </div>
          </div>
        </aside>
      </section>
    </SiteChrome>
  );
}
