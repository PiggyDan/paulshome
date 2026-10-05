// Date helpers for bookings. Dates are "YYYY-MM-DD" strings in Ulaanbaatar time (UTC+8, no DST).
// Safe to import from client components.

import type { Availability, Lang } from "./catalog";

export const UB_OFFSET_HOURS = 8;

export function ubToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ulaanbaatar" }).format(new Date());
}

const toUtc = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
const fromUtc = (d: Date) => d.toISOString().slice(0, 10);

export function addDays(date: string, days: number) {
  const d = toUtc(date);
  d.setUTCDate(d.getUTCDate() + days);
  return fromUtc(d);
}

/** 0 = Sunday … 6 = Saturday */
export function weekday(date: string) {
  return toUtc(date).getUTCDay();
}

export const isDate = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(toUtc(v).getTime());
export const isTime = (v: unknown): v is string => typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);

export const slotKey = (date: string, time: string) => `${date} ${time}`;

/** Whether a day can be booked at all (ignores which slots are taken). */
export function isOpenDay(date: string, a: Availability, today = ubToday()) {
  return (
    date >= addDays(today, a.leadDays) &&
    date <= addDays(today, a.horizonDays) &&
    a.workDays.includes(weekday(date)) &&
    !a.blockedDates.includes(date)
  );
}

/** Current time in Ulaanbaatar as "HH:MM". */
export function ubNowTime(): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ulaanbaatar", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date());
}

/** A slot today whose start time has already passed (matters when same-day booking is allowed). */
export function isPastSlot(date: string, time: string, today = ubToday(), now = ubNowTime()) {
  return date < today || (date === today && time <= now);
}

export function isOpenSlot(date: string, time: string, a: Availability, taken: Set<string>, today = ubToday()) {
  return isOpenDay(date, a, today) && a.slots.includes(time) && !taken.has(slotKey(date, time)) && !isPastSlot(date, time, today);
}

const MONTHS: Record<Lang, string[]> = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  mn: ["Нэгдүгээр сар", "Хоёрдугаар сар", "Гуравдугаар сар", "Дөрөвдүгээр сар", "Тавдугаар сар", "Зургаадугаар сар", "Долдугаар сар", "Наймдугаар сар", "Есдүгээр сар", "Аравдугаар сар", "Арван нэгдүгээр сар", "Арван хоёрдугаар сар"],
};
// Sunday first, matching Date#getDay.
const DAYS: Record<Lang, string[]> = {
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  mn: ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"],
};
const DAYS_SHORT: Record<Lang, string[]> = {
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  mn: ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"],
};

export const monthName = (month: number, lang: Lang) => MONTHS[lang][month];
export const dayName = (day: number, lang: Lang) => DAYS[lang][day];
export const dayShort = (day: number, lang: Lang) => DAYS_SHORT[lang][day];

/** "Tue, 7 Oct 2026" / "2026.10.07, Мягмар" */
export function formatDate(date: string, lang: Lang, withYear = true) {
  const [y, m, d] = date.split("-").map(Number);
  const wd = weekday(date);
  if (lang === "mn") return `${withYear ? `${y}.` : ""}${String(m).padStart(2, "0")}.${String(d).padStart(2, "0")}, ${DAYS.mn[wd]}`;
  return `${DAYS_SHORT.en[wd]}, ${d} ${MONTHS.en[m - 1].slice(0, 3)}${withYear ? ` ${y}` : ""}`;
}

export function formatWhen(date: string, time: string, lang: Lang) {
  return lang === "mn" ? `${formatDate(date, lang)}, ${time}` : `${formatDate(date, lang)} at ${time}`;
}

/** An .ics file so the customer can add the visit to their phone calendar. */
export function icsFor(opts: { id: string; date: string; time: string; title: string; description: string }) {
  const [y, m, d] = opts.date.split("-").map(Number);
  const [hh, mm] = opts.time.split(":").map(Number);
  const start = new Date(Date.UTC(y, m - 1, d, hh - UB_OFFSET_HOURS, mm));
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const stamp = (t: Date) => t.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Paul's Home Repair//Booking//EN",
    "BEGIN:VEVENT",
    `UID:${opts.id}@pauls-home-repair`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(opts.title)}`,
    `DESCRIPTION:${esc(opts.description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
