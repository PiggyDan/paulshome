import { promises as fs } from "fs";
import path from "path";

// Tiny key-value layer: Upstash Redis when its env vars are set (Vercel), otherwise a JSON file in data/
// that mimics the few Redis commands we use (local development).

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
export const hasRedis = Boolean(REDIS_URL && REDIS_TOKEN);

export async function redis<T = unknown>(command: (string | number)[]): Promise<T> {
  const res = await fetch(REDIS_URL!, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Redis ${command[0]} failed: ${res.status}`);
  return (await res.json()).result as T;
}

type FileStore = Record<string, string | string[] | Record<string, number>>;
const FILE = path.join(process.cwd(), "data", "kv.json");

async function load(): Promise<FileStore> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as FileStore;
  } catch {
    return {};
  }
}

async function save(store: FileStore) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(store));
}

const list = (v: FileStore[string] | undefined) => (Array.isArray(v) ? v : []);
const zset = (v: FileStore[string] | undefined) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});

export const kv = {
  async get(key: string): Promise<string | null> {
    if (hasRedis) return redis<string | null>(["GET", key]);
    const v = (await load())[key];
    return typeof v === "string" ? v : null;
  },

  async set(key: string, value: string) {
    if (hasRedis) return void (await redis(["SET", key, value]));
    const s = await load();
    s[key] = value;
    await save(s);
  },

  /** Appends to a list; returns the new length. */
  async rpush(key: string, value: string): Promise<number> {
    if (hasRedis) return redis<number>(["RPUSH", key, value]);
    const s = await load();
    const l = [...list(s[key]), value];
    s[key] = l;
    await save(s);
    return l.length;
  },

  /** Inclusive range like Redis; stop = -1 means "to the end". */
  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    if (hasRedis) return redis<string[]>(["LRANGE", key, start, stop]);
    return list((await load())[key]).slice(start, stop === -1 ? undefined : stop + 1);
  },

  async zadd(key: string, score: number, member: string) {
    if (hasRedis) return void (await redis(["ZADD", key, score, member]));
    const s = await load();
    s[key] = { ...zset(s[key]), [member]: score };
    await save(s);
  },

  /** Members by score, highest first. */
  async zrevrange(key: string, start: number, stop: number): Promise<string[]> {
    if (hasRedis) return redis<string[]>(["ZRANGE", key, start, stop, "REV"]);
    const sorted = Object.entries(zset((await load())[key])).sort((a, b) => b[1] - a[1]).map(([m]) => m);
    return sorted.slice(start, stop === -1 ? undefined : stop + 1);
  },

  async zrem(key: string, member: string) {
    if (hasRedis) return void (await redis(["ZREM", key, member]));
    const s = await load();
    const z = { ...zset(s[key]) };
    delete z[member];
    s[key] = z;
    await save(s);
  },

  async del(...keys: string[]) {
    if (hasRedis) return void (await redis(["DEL", ...keys]));
    const s = await load();
    keys.forEach((k) => delete s[k]);
    await save(s);
  },
};
