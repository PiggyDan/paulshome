// Live chat between customers and Paul. Safe to import from client components.

import type { Lang } from "./catalog";

export type ChatFrom = "user" | "bot" | "paul";

export type ChatMessage = { from: ChatFrom; text: string; at: string };

export type ChatMeta = {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  phone: string;
  lang: Lang;
  /** True once the customer asked for Paul or Paul replied; the bot then stays quiet. */
  human: boolean;
  /** Customer messages Paul hasn't read yet. */
  unread: number;
  last: string;
  lastFrom: ChatFrom;
  count: number;
};

export const MAX_MESSAGE = 1000;
export const MAX_MESSAGES_PER_CHAT = 400;
