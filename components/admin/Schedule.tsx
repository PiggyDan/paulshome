"use client";

import { useCallback, useEffect, useState } from "react";
import Icon from "@/components/Icon";
import type { RequestStatus, ServiceRequest } from "@/lib/catalog";
import { formatDate, ubToday } from "@/lib/dates";

/** Upcoming booked visits, grouped by day, with confirm / done / cancel. */
export default function Schedule() {
  const [items, setItems] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPast, setShowPast] = useState(false);
  const today = ubToday();

  const load = useCallback(async () => {
    const res = await fetch("/api/requests");
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function setStatus(r: ServiceRequest, status: RequestStatus) {
    if (status === "cancelled" && !confirm(`Cancel the visit with ${r.name}? The time slot becomes free for others to book.`)) return;
    setItems((list) => list.map((x) => (x.id === r.id ? { ...x, status } : x)));
    await fetch(`/api/requests/${r.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
  }

  const bookings = items
    .filter((r) => r.date && r.status !== "cancelled" && (showPast ? r.date < today : r.date >= today))
    .sort((a, b) => (showPast ? -1 : 1) * `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  const days = Array.from(new Set(bookings.map((r) => r.date)));
  const pending = bookings.filter((r) => r.status === "new" || r.status === "contacted").length;

  return (
    <>
      <h1>Schedule</h1>
      <p className="muted">Visits customers booked on the website. New bookings wait for you to call and confirm them.</p>
      <div className="stat-row three">
        <div className="stat"><strong>{bookings.length}</strong><span>{showPast ? "Past visits" : "Upcoming visits"}</span></div>
        <div className="stat"><strong>{pending}</strong><span>Waiting for confirmation</span></div>
        <div className="stat"><strong>{bookings.filter((r) => r.date === today).length}</strong><span>Today</span></div>
      </div>
      <div className="admin-bar">
        <div className="filter-row" style={{ margin: 0 }}>
          <button className={!showPast ? "on" : ""} onClick={() => setShowPast(false)}>Upcoming</button>
          <button className={showPast ? "on" : ""} onClick={() => setShowPast(true)}>Past</button>
        </div>
        <button className="button button-soft" onClick={load}>Refresh</button>
      </div>

      {loading && <div className="table-card empty">Loading…</div>}
      {!loading && days.length === 0 && (
        <div className="table-card empty">{showPast ? "No past visits." : "No upcoming visits booked yet."}</div>
      )}
      <div className="agenda">
        {days.map((day) => (
          <section key={day} className="agenda-day">
            <h2 className="agenda-date">
              {formatDate(day, "en")}
              {day === today && <span className="badge new">Today</span>}
            </h2>
            <div className="table-card">
              {bookings.filter((r) => r.date === day).map((r) => {
                const waiting = r.status === "new" || r.status === "contacted";
                return (
                  <div className="visit" key={r.id}>
                    <div className="visit-time">{r.time}</div>
                    <div className="visit-info">
                      <strong>{r.name}</strong>
                      <span className={`badge ${r.status}`}>{waiting ? "needs confirming" : r.status}</span>
                      <p>
                        {r.phone && <a href={`tel:${r.phone}`}><Icon name="phone" size={14} /> {r.phone}</a>}
                        {r.email && <a href={`mailto:${r.email}`}><Icon name="mail" size={14} /> {r.email}</a>}
                      </p>
                      <p><b>{r.service || "General visit"}</b>{r.message && ` · ${r.message}`}</p>
                    </div>
                    <div className="visit-actions">
                      {waiting && <button className="button button-primary small" onClick={() => setStatus(r, "scheduled")}><Icon name="check" size={16} /> Confirm</button>}
                      {r.status === "scheduled" && <button className="button button-soft small" onClick={() => setStatus(r, "done")}>Mark done</button>}
                      {r.status !== "done" && <button className="button button-soft small danger" onClick={() => setStatus(r, "cancelled")}>Cancel</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
