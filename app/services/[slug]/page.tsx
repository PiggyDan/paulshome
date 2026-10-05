import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteChrome from "@/components/SiteChrome";
import AskChatButton from "@/components/AskChatButton";
import Reveal from "@/components/Reveal";
import Icon from "@/components/Icon";
import { CATEGORIES, getServiceBySlug, getServices, loc, locList } from "@/lib/store";
import { getLang } from "@/lib/prefs";
import { DICT, EMAIL, fmt, PHONE, PHONE_HREF } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const service = await getServiceBySlug(params.slug);
  if (!service) return {};
  const lang = getLang();
  return {
    title: `${loc(service.title, lang)} | Paul's Home Repair`,
    description: loc(service.description, lang),
  };
}

export default async function ServicePage({ params }: Props) {
  const service = await getServiceBySlug(params.slug);
  if (!service) notFound();

  const lang = getLang();
  const t = DICT[lang];
  const title = loc(service.title, lang);
  const category = CATEGORIES.find((c) => c.id === service.category)!;
  const categoryLabel = loc(category.label, lang);
  const details = loc(service.details, lang);
  const includes = locList(service.includes, lang);
  const related = (await getServices()).filter((s) => s.category === service.category && s.id !== service.id);

  return (
    <SiteChrome>
      <Reveal />

      <section className="hero detail-hero">
        <div className="hero-glow" aria-hidden="true" />
        <div className="shell detail-hero-inner">
          <Link href="/#services" className="back-link"><Icon name="back" size={16} /> {t.detail.back}</Link>
          <p className="pill"><Icon name={service.category} size={16} /> {categoryLabel}</p>
          <h1>{title}</h1>
          <p className="hero-copy">{loc(service.description, lang)}</p>
          <div className="hero-actions">
            <a className="button button-primary" href={`/book?service=${service.slug}`}><Icon name="calendar" size={18} /> {t.detail.book}</a>
            <AskChatButton service={title} label={t.detail.ask} className="button button-ghost" />
          </div>
        </div>
      </section>

      <section className="section shell detail-grid">
        <div className="detail-main">
          {details && (
            <div className="reveal">
              <p className="kicker">{t.detail.about}</p>
              <p className="lead detail-text">{details}</p>
            </div>
          )}

          {includes.length > 0 && (
            <div className="reveal">
              <h2 className="detail-h2">{t.detail.included}</h2>
              <ul className="includes">
                {includes.map((item) => (
                  <li key={item}><span className="tick"><Icon name="check" size={16} /></span>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="reveal">
            <h2 className="detail-h2">{t.detail.howTitle}</h2>
            <ol className="mini-steps">
              {t.how.steps.map(([stepTitle, text], i) => (
                <li key={i}>
                  <span className="step-num">{i + 1}</span>
                  <div><strong>{stepTitle}</strong><p>{text}</p></div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <aside className="detail-cta reveal">
          <span className="cat-icon"><Icon name={service.category} size={26} /></span>
          <h3>{t.detail.ctaTitle}</h3>
          <p>{t.detail.ctaBody}</p>
          <a className="button button-primary" href={`/book?service=${service.slug}`}><Icon name="calendar" size={18} /> {t.detail.book}</a>
          <AskChatButton service={title} label={t.detail.ask} className="button button-soft" />
          <a className="button button-soft" href={PHONE_HREF}><Icon name="phone" size={18} /> {PHONE}</a>
          <a className="cta-mail" href={`mailto:${EMAIL}?subject=${encodeURIComponent(title)}`}><Icon name="mail" size={16} /> {EMAIL}</a>
        </aside>
      </section>

      {related.length > 0 && (
        <section className="section band">
          <div className="shell">
            <h2 className="detail-h2">{fmt(t.detail.related, { category: categoryLabel })}</h2>
            <div className="service-list">
              {related.map((s) => (
                <Link className="service-item" key={s.id} href={`/services/${s.slug}`}>
                  <span className="service-icon"><Icon name={s.category} /></span>
                  <div>
                    <h3>{loc(s.title, lang)}</h3>
                    <p>{loc(s.description, lang)}</p>
                  </div>
                  <span className="more-pill">{t.services.more} <Icon name="arrow" size={15} /></span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </SiteChrome>
  );
}
