"use client";

import { useEffect, useMemo, useState } from "react";
import Icon from "@/components/Icon";
import { DEFAULT_AVAILABILITY, type Availability, type ServiceRequest } from "@/lib/catalog";
import { addDays, dayName, formatDate, monthName, ubToday, weekday } from "@/lib/dates";

const WEEK = [1, 2, 3, 4, 5, 6, 0]; // Monday first
const SUNDAY = 0; // always closed

function shiftMonth(month: string, by: number) {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + by, 1)).toISOString().slice(0, 7);
}

/** Working days, visit times, days off (on a calendar) and booking window. */
export default function AvailabilityEditor() {
  const today = ubToday();
  const [a, setA] = useState<Availability | null>(null);
  const [visits, setVisits] = useState<Record<string, number>>({});
  const [month, setMonth] = useState(today.slice(0, 7));
  const [newSlot, setNewSlot] = useState("");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    fetch("/api/availability", { cache: "no-store" }).then((r) => r.json()).then((d) => setA(d.availability));
    // Booked visits per day, so Paul can see busy days before closing them.
    fetch("/api/requests", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((list: ServiceRequest[]) => {
        const counts: Record<string, number> = {};
        list.filter((r) => r.date && r.status !== "cancelled").forEach((r) => { counts[r.date] = (counts[r.date] ?? 0) + 1; });
        setVisits(counts);
      });
  }, []);

  const cells = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const blanks = (weekday(`${month}-01`) + 6) % 7;
    return [
      ...Array.from({ length: blanks }, () => null),
      ...Array.from({ length: days }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`),
    ];
  }, [month]);

  if (!a) return <div className="table-card empty">Loading…</div>;

  const change = (patch: Partial<Availability>) => {
    setSaved("");
    setA({ ...a, ...patch });
  };

  const toggleDay = (d: number) =>
    change({ workDays: a.workDays.includes(d) ? a.workDays.filter((x) => x !== d) : [...a.workDays, d] });

  const toggleOff = (date: string) => {
    const isOff = a.blockedDates.includes(date);
    if (!isOff && visits[date] && !confirm(`${formatDate(date, "en")} already has ${visits[date]} booked visit(s). Mark it as a day off anyway? Those bookings stay, so call the customers if you need to move them.`)) return;
    change({ blockedDates: isOff ? a.blockedDates.filter((x) => x !== date) : [...a.blockedDates, date].sort() });
  };

  const addSlot = () => {
    if (!newSlot || a.slots.includes(newSlot)) return;
    change({ slots: [...a.slots, newSlot].sort() });
    setNewSlot("");
  };

  async function save() {
    const res = await fetch("/api/availability", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(a) });
    if (res.ok) {
      setA(await res.json());
      setSaved("Saved. The booking calendar is updated.");
    } else {
      alert("Could not save. Are you still signed in?");
    }
  }

  const upcomingOff = a.blockedDates.filter((d) => d >= today);
  const lastBookable = addDays(today, a.horizonDays);

  return (
    <>
      <h1>Availability</h1>
      <p className="muted">Controls which days and times customers can pick. Existing bookings are not changed.</p>

      <div className="avail-grid">
        <section className="avail-card wide">
          <div className="avail-cal-head">
            <div>
              <h3>Days off</h3>
              <p className="muted small">Tap a day to make it a day off. Tap again to open it.</p>
            </div>
            <div className="cal-head">
              <button type="button" className="cal-nav" onClick={() => setMonth(shiftMonth(month, -1))} disabled={month <= today.slice(0, 7)} aria-label="Previous month">
                <Icon name="back" size={18} />
              </button>
              <strong>{monthName(Number(month.slice(5)) - 1, "en")} {month.slice(0, 4)}</strong>
              <button type="button" className="cal-nav" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Next month">
                <Icon name="arrow" size={18} />
              </button>
            </div>
          </div>

          <div className="admin-cal" role="grid">
            {WEEK.map((d) => <span key={d} className="cal-dow">{dayName(d, "en").slice(0, 3)}</span>)}
            {cells.map((date, i) => {
              if (!date) return <span key={`b${i}`} />;
              const wd = weekday(date);
              const past = date < today;
              const closed = wd === SUNDAY || !a.workDays.includes(wd);
              const off = a.blockedDates.includes(date);
              const count = visits[date] ?? 0;
              const beyond = date > lastBookable;
              const state = past ? "past" : closed ? "closed" : off ? "off" : "open";
              return (
                <button
                  type="button"
                  key={date}
                  className={`acal-day ${state}${date === today ? " today" : ""}${beyond && state === "open" ? " beyond" : ""}`}
                  disabled={past || closed}
                  aria-pressed={off}
                  aria-label={`${formatDate(date, "en")}: ${state === "off" ? "day off" : state}${count ? `, ${count} booked` : ""}`}
                  onClick={() => toggleOff(date)}
                >
                  <span className="acal-num">{Number(date.slice(8))}</span>
                  {state === "off" && <span className="acal-tag">Off</span>}
                  {state === "closed" && !past && <span className="acal-tag">Closed</span>}
                  {count > 0 && <span className="acal-count">{count} visit{count > 1 ? "s" : ""}</span>}
                </button>
              );
            })}
          </div>

          <div className="cal-legend">
            <span><i className="lg open" /> Open for booking</span>
            <span><i className="lg off" /> Day off</span>
            <span><i className="lg full" /> Closed</span>
            <span><i className="lg visits" /> Booked visits</span>
          </div>

          {upcomingOff.length > 0 && (
            <div className="tag-list">
              {upcomingOff.map((d) => (
                <span className="tag" key={d}>
                  {formatDate(d, "en")}
                  <button onClick={() => toggleOff(d)} aria-label={`Open ${d} again`}><Icon name="close" size={14} /></button>
                </span>
              ))}
            </div>
          )}
        </section>

        <section className="avail-card">
          <h3>Working days</h3>
          <div className="day-toggles">
            {WEEK.map((d) => (
              <button
                key={d}
                className={a.workDays.includes(d) ? "on" : ""}
                aria-pressed={a.workDays.includes(d)}
                disabled={d === SUNDAY}
                title={d === SUNDAY ? "Sunday is always off" : undefined}
                onClick={() => toggleDay(d)}
              >
                {dayName(d, "en").slice(0, 3)}
              </button>
            ))}
          </div>
          <p className="muted small">Sunday is always off.</p>
        </section>

        <section className="avail-card">
          <h3>Visit times</h3>
          <p className="muted small">Start times customers can choose. One booking per time.</p>
          <div className="tag-list">
            {a.slots.map((s) => (
              <span className="tag" key={s}>
                {s}
                <button onClick={() => change({ slots: a.slots.filter((x) => x !== s) })} aria-label={`Remove ${s}`}><Icon name="close" size={14} /></button>
              </span>
            ))}
            {a.slots.length === 0 && <span className="muted small">No times. Customers can&apos;t book.</span>}
          </div>
          <div className="inline-add">
            <input type="time" value={newSlot} onChange={(e) => setNewSlot(e.target.value)} aria-label="New time" />
            <button className="button button-soft" onClick={addSlot}>Add time</button>
          </div>
        </section>

        <section className="avail-card">
          <h3>Booking window</h3>
          <label>
            Earliest booking (days from today)
            <input type="number" min={0} max={30} value={a.leadDays} onChange={(e) => change({ leadDays: Number(e.target.value) })} />
          </label>
          <label>
            Book up to (days ahead)
            <input type="number" min={1} max={365} value={a.horizonDays} onChange={(e) => change({ horizonDays: Number(e.target.value) })} />
          </label>
          <button className="link-plain" onClick={() => change(DEFAULT_AVAILABILITY)}>Reset to defaults</button>
        </section>
      </div>

      <div className="admin-bar save-bar">
        <span className="toast">{saved}</span>
        <button className="button button-primary" onClick={save}>Save availability</button>
      </div>
    </>
  );
}
