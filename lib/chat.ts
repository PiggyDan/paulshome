import { randomUUID } from "crypto";
import { kv } from "./kv";
import type { Lang } from "./catalog";
import { MAX_MESSAGE, MAX_MESSAGES_PER_CHAT, type ChatFrom, type ChatMessage, type ChatMeta } from "./chat-types";

export * from "./chat-types";

// Each chat: a JSON meta record, an append-only message list, and an entry in an index sorted by last activity.
const META = (id: string) => `phr:chat:meta:${id}`;
const MSGS = (id: string) => `phr:chat:msgs:${id}`;
const INDEX = "phr:chat:index";

export const isChatId = (id: unknown): id is string =>
  typeof id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id);

export async function getChat(id: string): Promise<ChatMeta | null> {
  const raw = await kv.get(META(id));
  return raw ? (JSON.parse(raw) as ChatMeta) : null;
}

async function saveMeta(meta: ChatMeta) {
  await kv.set(META(meta.id), JSON.stringify(meta));
  await kv.zadd(INDEX, Date.parse(meta.updatedAt), meta.id);
}

export async function createChat(lang: Lang): Promise<ChatMeta> {
  const now = new Date().toISOString();
  const meta: ChatMeta = {
    id: randomUUID(), createdAt: now, updatedAt: now, name: "", phone: "", lang,
    human: false, unread: 0, last: "", lastFrom: "user", count: 0,
  };
  await saveMeta(meta);
  return meta;
}

/** Messages from index `after` onwards. */
export async function getMessages(id: string, after = 0): Promise<ChatMessage[]> {
  return (await kv.lrange(MSGS(id), Math.max(0, after), -1)).map((m) => JSON.parse(m) as ChatMessage);
}

export async function addMessage(id: string, from: ChatFrom, text: string): Promise<ChatMeta | "full" | null> {
  const meta = await getChat(id);
  if (!meta) return null;
  if (meta.count >= MAX_MESSAGES_PER_CHAT) return "full";
  const message: ChatMessage = { from, text: text.slice(0, MAX_MESSAGE), at: new Date().toISOString() };
  const count = await kv.rpush(MSGS(id), JSON.stringify(message));
  const updated: ChatMeta = {
    ...meta,
    count,
    updatedAt: message.at,
    last: message.text.slice(0, 140),
    lastFrom: from,
    unread: from === "user" ? meta.unread + 1 : from === "paul" ? 0 : meta.unread,
    human: meta.human || from === "paul",
  };
  await saveMeta(updated);
  return updated;
}

export async function updateChat(id: string, patch: Partial<Pick<ChatMeta, "name" | "phone" | "human" | "unread">>) {
  const meta = await getChat(id);
  if (!meta) return null;
  const updated = { ...meta, ...patch };
  await kv.set(META(id), JSON.stringify(updated));
  return updated;
}

export async function listChats(limit = 50): Promise<ChatMeta[]> {
  const ids = await kv.zrevrange(INDEX, 0, limit - 1);
  const metas = await Promise.all(ids.map(getChat));
  // Hide chats that never got a message (someone opened the widget and left).
  return metas.filter((m): m is ChatMeta => !!m && m.count > 0);
}

export async function deleteChat(id: string) {
  await kv.del(META(id), MSGS(id));
  await kv.zrem(INDEX, id);
}
