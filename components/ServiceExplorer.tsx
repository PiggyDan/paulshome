"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Icon from "./Icon";
import { useLang } from "./Prefs";
import { fmt } from "@/lib/i18n";
import type { Category } from "@/lib/catalog";

export type ServiceCard = { slug: string; category: Category; title: string; description: string };
type Cat = { id: Category; label: string; blurb: string };

export default function ServiceExplorer({ services, categories }: { services: ServiceCard[]; categories: Cat[] }) {
  const { t } = useLang();
  const [active, setActive] = useState<Category | "all">("all");

  // Hero tiles link to #cat-<id>: filter to that category and jump to the list.
  useEffect(() => {
    const apply = () => {
      const id = window.location.hash.replace("#cat-", "");
      if (!window.location.hash.startsWith("#cat-") || !categories.some((c) => c.id === id)) return;
      setActive(id as Category);
      document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
      history.replaceState(null, "", "#services");
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, [categories]);

  const shown = active === "all" ? services : services.filter((s) => s.category === active);

  return (
    <>
      <div className="cat-grid">
        {categories.map((c) => (
          <button
            key={c.id}
            className={`cat-card${active === c.id ? " active" : ""}`}
            onClick={() => setActive(active === c.id ? "all" : c.id)}
          >
            <span className="cat-icon"><Icon name={c.id} size={26} /></span>
            <strong>{c.label}</strong>
            <span>{c.blurb}</span>
            <em>{fmt(t.services.count, { n: services.filter((s) => s.category === c.id).length })}</em>
          </button>
        ))}
      </div>

      <div className="filter-row" role="tablist">
        <button role="tab" aria-selected={active === "all"} className={active === "all" ? "on" : ""} onClick={() => setActive("all")}>{t.services.all}</button>
        {categories.map((c) => (
          <button role="tab" key={c.id} aria-selected={active === c.id} className={active === c.id ? "on" : ""} onClick={() => setActive(c.id)}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="service-list">
        {shown.map((s) => (
          <Link className="service-item" key={s.slug} href={`/services/${s.slug}`}>
            <span className="service-icon"><Icon name={s.category} /></span>
            <div>
              <h3>{s.title}</h3>
              <p>{s.description}</p>
            </div>
            <span className="more-pill">{t.services.more} <Icon name="arrow" size={15} /></span>
          </Link>
        ))}
        {shown.length === 0 && <p className="muted">{t.services.empty}</p>}
      </div>
    </>
  );
}
