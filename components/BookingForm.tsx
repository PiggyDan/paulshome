"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Icon from "./Icon";
import { useLang } from "./Prefs";
import type { Availability } from "@/lib/catalog";
import { addDays, dayShort, formatDate, formatWhen, icsFor, isOpenDay, isPastSlot, monthName, slotKey, weekday } from "@/lib/dates";

type Data = { availability: Availability; taken: Set<string>; today: string };
type Booked = { id: string; date: string; time: string; service: string };

const WEEK = [1, 2, 3, 4, 5, 6, 0]; // Monday first
const monthOf = (date: string) => date.slice(0, 7);

function shiftMonth(month: string, by: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return d.toISOString().slice(0, 7);
}

/** Calendar + time slots + contact details. `defaultService` preselects a service (e.g. coming from a service page). */
export default function BookingForm({ serviceTitles = [], defaultService = "" }: { serviceTitles?: string[]; defaultService?: string }) {
  const { t, lang } = useLang();
  const [data, setData] = useState<Data | null>(null);
  const [month, setMonth] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState("");
  const [booked, setBooked] = useState<Booked | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/availability", { cache: "no-store" }).catch(() => null);
    if (!res?.ok) return;
    const json = (await res.json()) as { availability: Availability; taken: string[]; today: string };
    setData({ availability: json.availability, taken: new Set(json.taken), today: json.today });
    return json;
  }, []);

  useEffect(() => {
    load().then((json) => {
      if (!json) return;
      // Open the calendar on the month of the first bookable day.
      const a = json.availability;
      let first = json.today;
      for (let i = 0; i <= a.horizonDays; i++) {
        const d = addDays(json.today, i);
        if (isOpenDay(d, a, json.today)) { first = d; break; }
      }
      setMonth(monthOf(first));
    });
  }, [load]);

  const freeSlots = useCallback(
    (d: string) => (data ? data.availability.slots.filter((s) => !data.taken.has(slotKey(d, s)) && !isPastSlot(d, s, data.today)) : []),
    [data]
  );

  const cells = useMemo(() => {
    if (!data || !month) return [];
    const first = `${month}-01`;
    const [y, m] = month.split("-").map(Number);
    const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const blanks = (weekday(first) + 6) % 7;
    return [
      ...Array.from({ length: blanks }, () => null),
      ...Array.from({ length: days }, (_, i) => {
        const d = `${month}-${String(i + 1).padStart(2, "0")}`;
        const open = isOpenDay(d, data.availability, data.today);
        return { date: d, day: i + 1, open, full: open && freeSlots(d).length === 0 };
      }),
    ];
  }, [data, month, freeSlots]);

  if (booked) {
    const when = formatWhen(booked.date, booked.time, lang);
    const ics = icsFor({
      id: booked.id,
      date: booked.date,
      time: booked.time,
      title: t.book.calTitle,
      description: [booked.service, "+976 8921 1195"].filter(Boolean).join("\n"),
    });
    return (
      <div className="quote-card sent">
        <span className="sent-icon"><Icon name="check" size={30} /></span>
        <h3>{t.book.doneTitle}</h3>
        <p className="booked-when"><Icon name="clock" size={18} /> {when}</p>
        <p>{t.book.doneBody}</p>
        <div className="sent-actions">
          <a className="button button-primary" href={`data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`} download="pauls-home-repair-visit.ics">
            <Icon name="calendar" size={18} /> {t.book.addCal}
          </a>
          <button className="button button-soft" onClick={() => { setBooked(null); setDate(""); setTime(""); load(); }}>{t.book.another}</button>
        </div>
      </div>
    );
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!date || !time) {
      setError(t.book.chooseSlot);
      setState("error");
      return;
    }
    setState("sending");
    const form = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const chosen = form.service ?? "";
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, service: chosen, date, time }),
    }).catch(() => null);
    const json = await res?.json().catch(() => null);
    if (res?.ok) {
      setBooked({ id: json.id, date, time, service: chosen });
      setState("idle");
      return;
    }
    const code = json?.error;
    if (code === "taken" || code === "invalid_slot") {
      setTime("");
      load();
    }
    setError(
      code === "taken" ? t.book.taken : code === "invalid_slot" ? t.book.invalid : code === "missing_contact" ? t.form.needContact : t.form.error
    );
    setState("error");
  }

  const today = data?.today ?? "";
  const lastMonth = data ? monthOf(addDays(today, data.availability.horizonDays)) : "";

  return (
    <form className="quote-card booking" onSubmit={submit}>
      <div className="book-step day">
        <span className="step-label"><b>1</b> {t.book.stepDay}</span>
        {!data || !month ? (
          <p className="muted">{t.book.loading}</p>
        ) : (
          <div className="calendar">
            <div className="cal-head">
              <button type="button" className="cal-nav" onClick={() => setMonth(shiftMonth(month, -1))} disabled={month <= monthOf(today)} aria-label={t.book.prev}>
                <Icon name="back" size={18} />
              </button>
              <strong>{monthName(Number(month.slice(5)) - 1, lang)} {month.slice(0, 4)}</strong>
              <button type="button" className="cal-nav" onClick={() => setMonth(shiftMonth(month, 1))} disabled={month >= lastMonth} aria-label={t.book.next}>
                <Icon name="arrow" size={18} />
              </button>
            </div>
            <div className="cal-grid" role="grid">
              {WEEK.map((d) => <span key={d} className="cal-dow">{dayShort(d, lang)}</span>)}
              {cells.map((c, i) =>
                c ? (
                  <button
                    type="button"
                    key={c.date}
                    className={`cal-day${c.date === date ? " on" : ""}${c.open && !c.full ? " open" : ""}${c.full ? " full" : ""}${c.date === today ? " today" : ""}`}
                    disabled={!c.open || c.full}
                    aria-pressed={c.date === date}
                    aria-label={formatDate(c.date, lang)}
                    onClick={() => { setDate(c.date); setTime(""); setState("idle"); }}
                  >
                    {c.day}
                  </button>
                ) : (
                  <span key={`b${i}`} />
                )
              )}
            </div>
            <div className="cal-legend">
              <span><i className="lg open" /> {t.book.open}</span>
              <span><i className="lg full" /> {t.book.full}</span>
            </div>
          </div>
        )}
      </div>

      <div className="book-step time">
        <span className="step-label"><b>2</b> {t.book.stepTime}{date && <em>{formatDate(date, lang, false)}</em>}</span>
        {!date ? (
          <p className="muted small">{t.book.pickDayFirst}</p>
        ) : (
          <div className="slots">
            {data!.availability.slots.map((s) => {
              const taken = data!.taken.has(slotKey(date, s)) || isPastSlot(date, s, data!.today);
              return (
                <button type="button" key={s} className={`slot${time === s ? " on" : ""}`} disabled={taken} aria-pressed={time === s}
                  onClick={() => { setTime(s); setState("idle"); }}>
                  {s}
                </button>
              );
            })}
            {freeSlots(date).length === 0 && <p className="muted small">{t.book.noSlots}</p>}
          </div>
        )}
      </div>

      <div className="book-step details">
        <span className="step-label"><b>3</b> {t.book.stepDetails}</span>
        <div className="field-row">
          <label>{t.form.name}<input name="name" required autoComplete="name" /></label>
          <label>{t.form.phone}<input name="phone" type="tel" required autoComplete="tel" placeholder="+976" /></label>
        </div>
        <label>{t.form.email} <small>{t.form.optional}</small><input name="email" type="email" autoComplete="email" /></label>
        <label>
          {t.form.service}
          <select name="service" key={defaultService} defaultValue={defaultService}>
            <option value="">{t.form.notSure}</option>
            {serviceTitles.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label>{t.form.describe}<textarea name="message" rows={3} placeholder={t.form.placeholder} /></label>
      </div>

      {state === "error" && <p className="form-error">{error}</p>}
      <button className="button button-primary" disabled={state === "sending"}>
        <Icon name="check" size={18} />
        {state === "sending" ? t.book.submitting : date && time ? `${t.book.submit} · ${formatDate(date, lang, false)} ${time}` : t.book.submit}
      </button>
    </form>
  );
}
