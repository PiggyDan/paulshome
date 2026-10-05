"use client";

import { useCallback, useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { LogoFull, LogoMark } from "@/components/Logo";
import Schedule from "@/components/admin/Schedule";
import Chats from "@/components/admin/Chats";
import AvailabilityEditor from "@/components/admin/AvailabilityEditor";
import { CATEGORIES, STATUSES, type Category, type Lang, type RequestStatus, type Service, type ServiceRequest } from "@/lib/catalog";
import { formatWhen } from "@/lib/dates";

const TABS = [
  ["schedule", "Schedule"],
  ["chats", "Chats"],
  ["requests", "Requests"],
  ["availability", "Availability"],
  ["services", "Services"],
] as const;
type Tab = (typeof TABS)[number][0];

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/admin").then((r) => r.json()).then((d) => setAuthed(d.authenticated)).catch(() => setAuthed(false));
  }, []);

  if (authed === null) return <div className="login" />;
  if (!authed) return <Login onDone={() => setAuthed(true)} />;
  return <Dashboard onLogout={() => setAuthed(false)} />;
}

function Login({ onDone }: { onDone: () => void }) {
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = new FormData(e.currentTarget).get("password");
    const res = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    if (res.ok) onDone();
    else setError((await res.json().catch(() => null))?.error ?? "Wrong password");
  }
  return (
    <div className="login admin">
      <form onSubmit={submit}>
        <div className="login-logo"><LogoFull width={220} /></div>
        <h1>Admin sign in</h1>
        <label>Password<input name="password" type="password" autoFocus required /></label>
        {error && <p className="form-error">{error}</p>}
        <button className="button button-primary">Sign in</button>
        <a href="/" className="muted" style={{ fontSize: 14, textAlign: "center" }}>← Back to site</a>
      </form>
    </div>
  );
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("schedule");
  const [unread, setUnread] = useState(0);

  // Unread chat count for the tab badge and the browser tab title.
  useEffect(() => {
    const check = () =>
      fetch("/api/admin/chats", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => j && setUnread(j.unread))
        .catch(() => {});
    check();
    const timer = setInterval(check, 15000);
    return () => clearInterval(timer);
  }, [tab]);

  useEffect(() => {
    document.title = unread ? `(${unread}) Admin · Paul's Home Repair` : "Admin · Paul's Home Repair";
  }, [unread]);

  async function logout() {
    await fetch("/api/admin", { method: "DELETE" });
    onLogout();
  }

  return (
    <div className="admin">
      <header className="admin-top">
        <div className="shell">
          <a className="brand" href="/"><LogoMark size={34} /><span>Admin</span></a>
          <nav>
            {TABS.map(([id, label]) => (
              <button key={id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>
                {label}
                {id === "chats" && unread > 0 && <span className="unread-dot static">{unread}</span>}
              </button>
            ))}
          </nav>
          <button className="plain" onClick={logout}>Log out</button>
        </div>
      </header>
      <main className="shell admin-main">
        {tab === "schedule" && <Schedule />}
        {tab === "chats" && <Chats />}
        {tab === "requests" && <Requests />}
        {tab === "availability" && <AvailabilityEditor />}
        {tab === "services" && <Services />}
      </main>
    </div>
  );
}

function Requests() {
  const [items, setItems] = useState<ServiceRequest[]>([]);
  const [filter, setFilter] = useState<RequestStatus | "all">("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/requests");
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function setStatus(id: string, status: RequestStatus) {
    setItems((list) => list.map((r) => (r.id === id ? { ...r, status } : r)));
    await fetch(`/api/requests/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
  }

  async function remove(id: string) {
    if (!confirm("Delete this request?")) return;
    setItems((list) => list.filter((r) => r.id !== id));
    await fetch(`/api/requests/${id}`, { method: "DELETE" });
  }

  const shown = filter === "all" ? items : items.filter((r) => r.status === filter);

  return (
    <>
      <h1>All requests</h1>
      <p className="muted">Everything sent from the booking calendar and the chatbot.</p>
      <div className="stat-row">
        {STATUSES.map((s) => (
          <div className="stat" key={s}><strong>{items.filter((r) => r.status === s).length}</strong><span>{s}</span></div>
        ))}
      </div>
      <div className="admin-bar">
        <div className="filter-row" style={{ margin: 0 }}>
          {(["all", ...STATUSES] as const).map((s) => (
            <button key={s} className={filter === s ? "on" : ""} onClick={() => setFilter(s)} style={{ textTransform: "capitalize" }}>{s}</button>
          ))}
        </div>
        <button className="button button-soft" onClick={load}>Refresh</button>
      </div>
      <div className="table-card">
        {loading && <div className="empty">Loading…</div>}
        {!loading && shown.length === 0 && <div className="empty">No requests here yet.</div>}
        {shown.map((r) => (
          <div className="req" key={r.id}>
            <div>
              <strong>{r.name}</strong><span className={`badge ${r.status}`}>{r.status}</span>
              <p>
                {r.phone && <a href={`tel:${r.phone}`}>{r.phone}</a>}
                {r.phone && r.email && " · "}
                {r.email && <a href={`mailto:${r.email}`}>{r.email}</a>}
              </p>
              <small>{new Date(r.createdAt).toLocaleString()} · via {r.source}</small>
            </div>
            <div>
              {r.date && <span className="booking-chip"><Icon name="calendar" size={14} /> {formatWhen(r.date, r.time, "en")}</span>}
              <strong style={{ fontSize: 14 }}>{r.service || "General enquiry"}</strong>
              <p>{r.message || "No details given."}</p>
            </div>
            <div className="req-actions">
              <select value={r.status} onChange={(e) => setStatus(r.id, e.target.value as RequestStatus)} aria-label="Status">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <button className="icon-btn" onClick={() => remove(r.id)} aria-label="Delete"><Icon name="close" size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// "What's included" is edited as one item per line, so keep the raw text while typing.
type Draft = Service & { key: string; open: boolean; includesText: Record<Lang, string> };

const toDraft = (s: Service, open = false): Draft => ({
  ...s,
  key: s.id || Math.random().toString(36).slice(2),
  open,
  includesText: { en: s.includes.en.join("\n"), mn: s.includes.mn.join("\n") },
});

const lines = (text: string) => text.split("\n").map((l) => l.trim()).filter(Boolean);

const BLANK: Service = {
  id: "", slug: "", category: "repairs",
  title: { en: "", mn: "" }, description: { en: "", mn: "" }, details: { en: "", mn: "" }, includes: { en: [], mn: [] },
};

function Services() {
  const [items, setItems] = useState<Draft[]>([]);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    fetch("/api/services").then((r) => r.json()).then((list: Service[]) => setItems(list.map((s) => toDraft(s))));
  }, []);

  const update = (key: string, patch: (d: Draft) => Partial<Draft>) => {
    setSaved("");
    setItems((list) => list.map((d) => (d.key === key ? { ...d, ...patch(d) } : d)));
  };

  async function save() {
    const payload: Service[] = items.map(({ key, open, includesText, ...s }) => ({
      ...s,
      includes: { en: lines(includesText.en), mn: lines(includesText.mn) },
    }));
    const res = await fetch("/api/services", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) {
      const openKeys = new Set(items.filter((d) => d.open).map((d) => d.id));
      setItems(((await res.json()) as Service[]).map((s) => toDraft(s, openKeys.has(s.id))));
      setSaved("Saved. The website is updated.");
    } else {
      setSaved("");
      alert("Could not save. Are you still signed in?");
    }
  }

  const field = (d: Draft, name: "title" | "description" | "details", lang: Lang, label: string, multiline = false) => {
    const props = {
      value: d[name][lang],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        update(d.key, (cur) => ({ [name]: { ...cur[name], [lang]: e.target.value } })),
    };
    return (
      <label>
        {label}
        {multiline ? <textarea rows={4} {...props} /> : <input {...props} />}
      </label>
    );
  };

  return (
    <>
      <h1>Services</h1>
      <p className="muted">
        Each service has its own page on the website. Fill in English and Mongolian (МН). If a Mongolian field is empty, the English text is shown instead.
      </p>
      <div className="admin-bar">
        <button className="button button-soft" onClick={() => { setSaved(""); setItems([...items, toDraft(BLANK, true)]); }}>
          + Add service
        </button>
        <span className="toast">{saved}</span>
        <button className="button button-primary" onClick={save}>Save changes</button>
      </div>
      <div className="svc-list">
        {items.map((d) => (
          <div className={`svc-card${d.open ? " open" : ""}`} key={d.key}>
            <button className="svc-head" onClick={() => update(d.key, (cur) => ({ open: !cur.open }))} aria-expanded={d.open}>
              <span className="service-icon"><Icon name={d.category} size={18} /></span>
              <span className="svc-head-text">
                <strong>{d.title.en || "New service"}</strong>
                <small>{d.title.mn || "No Mongolian title yet"}{d.slug && ` · /services/${d.slug}`}</small>
              </span>
              <Icon name="arrow" size={16} />
            </button>
            {d.open && (
              <div className="svc-body">
                <div className="svc-top">
                  <label>
                    Category
                    <select value={d.category} onChange={(e) => update(d.key, () => ({ category: e.target.value as Category }))}>
                      {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label.en}</option>)}
                    </select>
                  </label>
                  {d.slug && <a className="button button-soft" href={`/services/${d.slug}`} target="_blank" rel="noreferrer">View page</a>}
                  <button className="icon-btn" onClick={() => { if (confirm("Remove this service?")) { setSaved(""); setItems(items.filter((x) => x.key !== d.key)); } }} aria-label="Remove service">
                    <Icon name="close" size={16} />
                  </button>
                </div>
                <div className="svc-cols">
                  {(["en", "mn"] as const).map((lang) => (
                    <div key={lang} className="svc-col">
                      <span className="svc-lang">{lang === "en" ? "English" : "Монгол"}</span>
                      {field(d, "title", lang, "Name")}
                      {field(d, "description", lang, "Short description (shown on the service card)")}
                      {field(d, "details", lang, "Full explanation (service page)", true)}
                      <label>
                        What&apos;s included (one per line)
                        <textarea rows={4} value={d.includesText[lang]}
                          onChange={(e) => update(d.key, (cur) => ({ includesText: { ...cur.includesText, [lang]: e.target.value } }))} />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && <div className="table-card empty">No services yet.</div>}
      </div>
      <div className="admin-bar">
        <span />
        <button className="button button-primary" onClick={save}>Save changes</button>
      </div>
    </>
  );
}
