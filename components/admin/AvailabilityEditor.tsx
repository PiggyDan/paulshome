"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { DEFAULT_AVAILABILITY, type Availability } from "@/lib/catalog";
import { dayName, formatDate, ubToday } from "@/lib/dates";

const WEEK = [1, 2, 3, 4, 5, 6, 0];

/** Working days, time slots, days off and booking window. */
export default function AvailabilityEditor() {
  const [a, setA] = useState<Availability | null>(null);
  const [newSlot, setNewSlot] = useState("");
  const [newOff, setNewOff] = useState("");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    fetch("/api/availability", { cache: "no-store" }).then((r) => r.json()).then((d) => setA(d.availability));
  }, []);

  if (!a) return <div className="table-card empty">Loading…</div>;

  const change = (patch: Partial<Availability>) => {
    setSaved("");
    setA({ ...a, ...patch });
  };

  const toggleDay = (d: number) =>
    change({ workDays: a.workDays.includes(d) ? a.workDays.filter((x) => x !== d) : [...a.workDays, d] });

  const addSlot = () => {
    if (!newSlot || a.slots.includes(newSlot)) return;
    change({ slots: [...a.slots, newSlot].sort() });
    setNewSlot("");
  };

  const addOff = () => {
    if (!newOff || a.blockedDates.includes(newOff)) return;
    change({ blockedDates: [...a.blockedDates, newOff].sort() });
    setNewOff("");
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

  const upcomingOff = a.blockedDates.filter((d) => d >= ubToday());

  return (
    <>
      <h1>Availability</h1>
      <p className="muted">Controls which days and times customers can pick. Existing bookings are not changed.</p>

      <div className="avail-grid">
        <section className="avail-card">
          <h3>Working days</h3>
          <div className="day-toggles">
            {WEEK.map((d) => (
              <button key={d} className={a.workDays.includes(d) ? "on" : ""} aria-pressed={a.workDays.includes(d)} onClick={() => toggleDay(d)}>
                {dayName(d, "en").slice(0, 3)}
              </button>
            ))}
          </div>
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
          <h3>Days off</h3>
          <p className="muted small">Holidays or days you&apos;re busy. Nobody can book these.</p>
          <div className="tag-list">
            {upcomingOff.map((d) => (
              <span className="tag" key={d}>
                {formatDate(d, "en")}
                <button onClick={() => change({ blockedDates: a.blockedDates.filter((x) => x !== d) })} aria-label={`Remove ${d}`}><Icon name="close" size={14} /></button>
              </span>
            ))}
            {upcomingOff.length === 0 && <span className="muted small">No days off planned.</span>}
          </div>
          <div className="inline-add">
            <input type="date" value={newOff} min={ubToday()} onChange={(e) => setNewOff(e.target.value)} aria-label="Day off" />
            <button className="button button-soft" onClick={addOff}>Add day off</button>
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

      <div className="admin-bar">
        <span className="toast">{saved}</span>
        <button className="button button-primary" onClick={save}>Save availability</button>
      </div>
    </>
  );
}
