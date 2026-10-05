import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

import { CATEGORIES, DEFAULT_AVAILABILITY, slugify, type Availability, type Localized, type LocalizedList, type RequestStatus, type Service, type ServiceRequest } from "./catalog";
import { isDate, isOpenSlot, isTime, slotKey } from "./dates";
import { DEFAULT_SERVICES } from "./defaults";
import { hasRedis, redis } from "./kv";

export * from "./catalog";

type Db = { services: Service[]; requests: ServiceRequest[]; availability: Availability };

const str = (v: unknown, max = 2000) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function toLocalized(v: unknown, max: number): Localized {
  if (typeof v === "string") return { en: str(v, max), mn: "" };
  const o = (v ?? {}) as Record<string, unknown>;
  return { en: str(o.en, max), mn: str(o.mn, max) };
}

function toList(v: unknown): LocalizedList {
  const o = (v ?? {}) as Record<string, unknown>;
  const list = (x: unknown) => (Array.isArray(x) ? x.map((i) => str(i, 200)).filter(Boolean).slice(0, 20) : []);
  return { en: list(o.en), mn: list(o.mn) };
}

/** Coerces anything (old single-language records, admin input) into a full Service. */
export function normalizeService(raw: unknown): Service | null {
  const o = (raw ?? {}) as Record<string, unknown>;
  const category = CATEGORIES.some((c) => c.id === o.category) ? (o.category as Service["category"]) : null;
  if (!category) return null;

  // Records saved before translations existed: upgrade from the matching default if there is one.
  if (typeof o.title === "string") {
    const match = DEFAULT_SERVICES.find((d) => d.title.en === o.title);
    if (match) return { ...match, id: str(o.id) || randomUUID(), category };
  }

  const title = toLocalized(o.title, 80);
  if (!title.en) return null;
  return {
    id: str(o.id) || randomUUID(),
    slug: str(o.slug, 80),
    category,
    title,
    description: toLocalized(o.description, 300),
    details: toLocalized(o.details, 2000),
    includes: toList(o.includes),
  };
}

function withUniqueSlugs(services: Service[]) {
  const used = new Set<string>();
  return services.map((s) => {
    const base = slugify(s.slug || s.title.en);
    let slug = base;
    for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;
    used.add(slug);
    return { ...s, slug };
  });
}

// Storage: Upstash Redis when its env vars are set (Vercel, where the file system is read-only),
// otherwise a JSON file in data/ (local development or a normal server).
const DB_PATH = path.join(process.cwd(), "data", "db.json");
const REDIS_KEY = "pauls-home-repair:db";

async function loadRaw(): Promise<Db | null> {
  if (hasRedis) {
    const value = await redis<string | null>(["GET", REDIS_KEY]);
    return value ? (JSON.parse(value) as Db) : null;
  }
  try {
    return JSON.parse(await fs.readFile(DB_PATH, "utf8")) as Db;
  } catch {
    return null;
  }
}

async function writeDb(db: Db) {
  if (hasRedis) {
    await redis(["SET", REDIS_KEY, JSON.stringify(db)]);
    return;
  }
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
}

/** Best-effort save while reading, so pages still render when storage is read-only. */
async function trySave(db: Db) {
  try {
    await writeDb(db);
  } catch (err) {
    console.warn("[store] could not save; running read-only. Connect a database to enable bookings.", err);
  }
}

/** `forWrite`: refuse to continue after a failed read, so a save can never replace real data with defaults. */
async function readDb(forWrite = false): Promise<Db> {
  let raw: Db | null = null;
  let readFailed = false;
  try {
    raw = await loadRaw();
  } catch (err) {
    console.error("[store] could not read data; showing defaults.", err);
    if (forWrite) throw err;
    readFailed = true;
  }
  if (!raw) {
    const db: Db = { services: DEFAULT_SERVICES.map((s) => ({ ...s, id: randomUUID() })), requests: [], availability: DEFAULT_AVAILABILITY };
    // Only seed brand-new storage. After a failed read, saving would overwrite real data.
    if (!readFailed) await trySave(db);
    return db;
  }
  const db = raw;
  const before = JSON.stringify(db.services);
  db.services = withUniqueSlugs((db.services ?? []).map(normalizeService).filter((s): s is Service => !!s));
  db.requests = (db.requests ?? []).map((r) => ({ ...r, date: r.date ?? "", time: r.time ?? "" }));
  db.availability = normalizeAvailability(db.availability);
  if (JSON.stringify(db.services) !== before) await trySave(db);
  return db;
}

export async function getServices() {
  return (await readDb()).services;
}

export async function getServiceBySlug(slug: string) {
  return (await getServices()).find((s) => s.slug === slug) ?? null;
}

export async function saveServices(services: Service[]) {
  const db = await readDb(true);
  db.services = withUniqueSlugs(services);
  await writeDb(db);
  return db.services;
}

export function normalizeAvailability(raw: unknown): Availability {
  const o = (raw ?? {}) as Partial<Record<keyof Availability, unknown>>;
  const nums = (v: unknown) => (Array.isArray(v) ? v.filter((n): n is number => Number.isInteger(n) && n >= 0 && n <= 6) : null);
  const int = (v: unknown, min: number, max: number, fallback: number) =>
    typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : fallback;
  return {
    workDays: Array.from(new Set(nums(o.workDays) ?? DEFAULT_AVAILABILITY.workDays)).sort(),
    slots: Array.isArray(o.slots) ? Array.from(new Set(o.slots.filter(isTime))).sort() : DEFAULT_AVAILABILITY.slots,
    blockedDates: Array.isArray(o.blockedDates) ? Array.from(new Set(o.blockedDates.filter(isDate))).sort() : [],
    leadDays: int(o.leadDays, 0, 30, DEFAULT_AVAILABILITY.leadDays),
    horizonDays: int(o.horizonDays, 1, 365, DEFAULT_AVAILABILITY.horizonDays),
  };
}

export async function getAvailability() {
  return (await readDb()).availability;
}

export async function saveAvailability(raw: unknown) {
  const db = await readDb(true);
  db.availability = normalizeAvailability(raw);
  await writeDb(db);
  return db.availability;
}

const takenFrom = (requests: ServiceRequest[]) =>
  new Set(requests.filter((r) => r.date && r.time && r.status !== "cancelled").map((r) => slotKey(r.date, r.time)));

/** Booked slots as "YYYY-MM-DD HH:MM", without any customer details. */
export async function getTakenSlots() {
  return Array.from(takenFrom((await readDb()).requests));
}

type NewRequest = Omit<ServiceRequest, "id" | "status" | "createdAt">;

/** Saves a request; when it carries a date and time, the slot must still be open. */
export async function addRequest(input: NewRequest): Promise<ServiceRequest | "taken" | "invalid_slot"> {
  const db = await readDb(true);
  if (input.date || input.time) {
    if (!isDate(input.date) || !isTime(input.time)) return "invalid_slot";
    const taken = takenFrom(db.requests);
    if (taken.has(slotKey(input.date, input.time))) return "taken";
    if (!isOpenSlot(input.date, input.time, db.availability, taken)) return "invalid_slot";
  }
  const request: ServiceRequest = { ...input, id: randomUUID(), status: "new", createdAt: new Date().toISOString() };
  db.requests.push(request);
  await writeDb(db);
  return request;
}

export async function getRequests() {
  return (await readDb()).requests.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateRequest(id: string, status: RequestStatus) {
  const db = await readDb(true);
  const request = db.requests.find((r) => r.id === id);
  if (!request) return null;
  request.status = status;
  await writeDb(db);
  return request;
}

export async function deleteRequest(id: string) {
  const db = await readDb(true);
  const before = db.requests.length;
  db.requests = db.requests.filter((r) => r.id !== id);
  await writeDb(db);
  return db.requests.length < before;
}
