"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "./Icon";
import { LogoMark } from "./Logo";
import { useLang } from "./Prefs";
import { fmt, PHONE, type Dict } from "@/lib/i18n";
import type { ChatFrom, ChatMessage } from "@/lib/chat-types";

type Action = "pickDate" | "leaveDetails" | "talkToPaul";
type Msg = { from: ChatFrom; text: string; actions?: Action[] };
type Step = "idle" | "name" | "phone" | "job";

/** Detail passed with the "open-chat" event, e.g. from a service page. */
export type OpenChatDetail = { service?: string };

type Topic = "urgent" | "price" | "area" | "hours" | "about" | "wood" | "winter" | "services" | "thanks" | "hi";

// Keywords in English and Mongolian, so either language is understood whichever UI language is on.
const TOPICS: [Topic | "BOOK" | "HUMAN", string[]][] = [
  ["HUMAN", ["message paul", "talk to paul", "speak to paul", "chat with paul", "real person", "human", "operator", "паултай", "хүнтэй ярих"]],
  ["BOOK", ["book", "quote", "estimate", "request", "appointment", "schedule", "hire", "захиал", "үнийн санал", "санал авах", "хүсэлт", "дуудах"]],
  ["urgent", ["emergency", "urgent", "leak", "flood", "asap", "яаралтай", "гоож", "үер"]],
  ["price", ["price", "cost", "how much", "rate", "charge", "expensive", "cheap", "үнэ", "хэд вэ", "төлбөр", "зардал", "хямд"]],
  ["area", ["where", "area", "location", "gachuurt", "district", "travel", "хаана", "байршил", "дүүрэг", "гачуурт", "хүрч"]],
  ["hours", ["hour", "open", "when", "weekend", "today", "tomorrow", "хэзээ", "цаг", "өнөөдөр", "маргааш", "амралт"]],
  ["wood", ["wood", "cabin", "porch", "deck", "cladding", "timber", "carpent", "мод", "байшин", "веранда", "тавцан", "мужаан"]],
  ["winter", ["winter", "insulat", "draft", "cold", "maintenance", "өвөл", "дулаал", "хүйтэн", "салхи", "арчилгаа"]],
  ["about", ["experience", "years", "since", "who is", "about", "туршлага", "хэдэн жил", "хэн", "тухай"]],
  ["services", ["service", "do you", "offer", "fix", "repair", "help with", "what can", "үйлчилгээ", "юу хийдэг", "засвар", "засах", "туслах"]],
  ["thanks", ["thank", "баярлалаа", "баярла"]],
  ["hi", ["hello", "hey", " hi ", "сайн байна", "сайн уу", "мэнд"]],
];

type Reply = { kind: "book" } | { kind: "human" } | { kind: "text"; text: string; fallback: boolean };

function answer(input: string, t: Dict["chat"], serviceTitles: string[]): Reply {
  const q = ` ${input.toLowerCase()} `;
  const topic = TOPICS.find(([, words]) => words.some((w) => q.includes(w)))?.[0];
  if (topic === "BOOK") return { kind: "book" };
  if (topic === "HUMAN") return { kind: "human" };
  if (!topic) return { kind: "text", text: fmt(t.fallback, { phone: PHONE }), fallback: true };
  return { kind: "text", text: fmt(t[topic], { phone: PHONE, list: serviceTitles.slice(0, 8).join(", ") }), fallback: false };
}

// The conversation id lives only in this browser; it's the customer's key to their chat with Paul.
const STORE_KEY = "phr-chat-id";
const readId = () => { try { return localStorage.getItem(STORE_KEY); } catch { return null; } };
const writeId = (id: string | null) => {
  try { if (id) localStorage.setItem(STORE_KEY, id); else localStorage.removeItem(STORE_KEY); } catch {}
};
const JSON_HEADERS = { "Content-Type": "application/json" };

export default function ChatBot({ serviceTitles }: { serviceTitles: string[] }) {
  const { t: dict, lang } = useLang();
  const t = dict.chat;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [lead, setLead] = useState({ name: "", phone: "", service: "" });
  const [typing, setTyping] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);
  const [human, setHuman] = useState(false);
  const [unread, setUnread] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);
  const stepRef = useRef(step);
  stepRef.current = step;
  const openRef = useRef(open);
  openRef.current = open;

  // --- Server sync -------------------------------------------------------
  const idRef = useRef<string | null>(null);
  const creating = useRef<Promise<string | null> | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const synced = useRef(0); // messages on the server we've already accounted for

  const ensureChat = useCallback(() => {
    if (idRef.current) return Promise.resolve(idRef.current);
    creating.current ??= fetch("/api/chat", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ lang }) })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { id: string } | null) => {
        if (!j) { creating.current = null; return null; }
        idRef.current = j.id;
        writeId(j.id);
        setConvId(j.id);
        return j.id;
      })
      .catch(() => { creating.current = null; return null; });
    return creating.current;
  }, [lang]);

  /** Saves a message so Paul can see it. Queued so messages arrive in order. */
  const persist = useCallback((from: "user" | "bot", text: string) => {
    queue.current = queue.current.then(async () => {
      const id = await ensureChat();
      if (!id) return;
      const res = await fetch(`/api/chat/${id}`, { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ from, text }) }).catch(() => null);
      const json = await res?.json().catch(() => null);
      if (json?.count) synced.current = Math.max(synced.current, json.count);
    });
  }, [ensureChat]);

  const patchChat = useCallback(async (patch: { name?: string; phone?: string; human?: boolean }) => {
    const id = await ensureChat();
    if (id) fetch(`/api/chat/${id}`, { method: "PATCH", headers: JSON_HEADERS, body: JSON.stringify(patch) }).catch(() => {});
  }, [ensureChat]);

  // Restore an earlier conversation from this browser.
  useEffect(() => {
    const id = readId();
    if (!id) return;
    fetch(`/api/chat/${id}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((j: { human: boolean; count: number; messages: ChatMessage[] }) => {
        idRef.current = id;
        setConvId(id);
        setHuman(j.human);
        synced.current = j.count;
        setMsgs(j.messages.map((m) => ({ from: m.from, text: m.text })));
      })
      .catch((status) => { if (status === 404) writeId(null); });
  }, []);

  // Check for Paul's replies: often while the chat is open, now and then while it's closed.
  useEffect(() => {
    if (!convId) return;
    const every = open ? 5000 : human ? 20000 : 0;
    if (!every) return;
    const poll = async () => {
      const res = await fetch(`/api/chat/${convId}?after=${synced.current}`, { cache: "no-store" }).catch(() => null);
      if (!res?.ok) return;
      const j = (await res.json()) as { human: boolean; count: number; messages: ChatMessage[] };
      synced.current = Math.max(synced.current, j.count);
      if (j.human) setHuman(true);
      const fromPaul = j.messages.filter((m) => m.from === "paul");
      if (!fromPaul.length) return;
      setMsgs((m) => [...m, ...fromPaul.map((p) => ({ from: p.from, text: p.text }))]);
      if (!openRef.current) setUnread((u) => u + fromPaul.length);
    };
    const timer = setInterval(poll, every);
    return () => clearInterval(timer);
  }, [convId, open, human]);

  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("chat-unread", { detail: unread }));
  }, [unread]);

  // --- Conversation ------------------------------------------------------
  const botSay = (text: string, actions?: Action[]) => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { from: "bot", text, actions }]);
      persist("bot", text);
    }, 450);
  };

  const startHuman = () => {
    setHuman(true);
    patchChat({ human: true });
    botSay(t.humanOn);
  };

  const act = (action: Action) => {
    if (action === "talkToPaul") {
      setMsgs((m) => [...m, { from: "user", text: t.talkToPaul }]);
      persist("user", t.talkToPaul);
      return startHuman();
    }
    if (action === "leaveDetails") {
      setMsgs((m) => [...m, { from: "user", text: t.leaveDetails }]);
      persist("user", t.leaveDetails);
      setStep("name");
      return botSay(t.askName);
    }
    // Close the chat and open the booking page.
    setOpen(false);
    router.push("/book");
  };

  useEffect(() => {
    const onOpen = (e: Event) => {
      setOpen(true);
      const service = (e as CustomEvent<OpenChatDetail | undefined>).detail?.service;
      if (service && stepRef.current === "idle") {
        setLead({ name: "", phone: "", service });
        setStep("name");
        botSay(fmt(t.fromService, { service }));
      }
    };
    window.addEventListener("open-chat", onOpen);
    return () => window.removeEventListener("open-chat", onOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  useEffect(() => {
    document.body.classList.toggle("chat-open", open);
  }, [open]);

  useEffect(() => {
    // Scroll only the message list, never the page behind the chat.
    const el = bodyRef.current;
    if (el && open) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [msgs, typing, open]);

  async function send(raw: string) {
    const text = raw.trim();
    if (!text) return;
    setInput("");
    setMsgs((m) => [...m, { from: "user", text }]);
    persist("user", text);

    if (step === "name") {
      setLead((l) => ({ ...l, name: text }));
      patchChat({ name: text });
      setStep("phone");
      return botSay(fmt(t.askPhone, { name: text }));
    }
    if (step === "phone") {
      setLead((l) => ({ ...l, phone: text }));
      patchChat({ phone: text });
      setStep("job");
      return botSay(lead.service ? fmt(t.askJobService, { service: lead.service }) : t.askJob);
    }
    if (step === "job") {
      setStep("idle");
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ name: lead.name, phone: lead.phone, service: lead.service, message: text, source: "chat" }),
      }).catch(() => null);
      setLead({ name: "", phone: "", service: "" });
      return botSay(res?.ok ? t.done : fmt(t.fail, { phone: PHONE }));
    }

    // Talking to Paul: the bot stays quiet and Paul answers from admin.
    if (human) return;

    const reply = answer(text, t, serviceTitles);
    if (reply.kind === "book") return botSay(t.bookChoice, ["pickDate", "leaveDetails"]);
    if (reply.kind === "human") return startHuman();
    botSay(reply.text, reply.fallback ? ["talkToPaul"] : undefined);
  }

  const placeholder = step === "phone" ? t.phPhonePlaceholder : step === "name" ? t.phNamePlaceholder : t.placeholder;
  const last = msgs[msgs.length - 1];

  return (
    <>
      <button className={`chat-fab${open ? " hidden" : ""}`} onClick={() => setOpen(true)} aria-label={t.open}>
        <Icon name="chat" size={24} />
        <span className="chat-fab-label">{unread ? t.newReply : t.fab}</span>
        {unread > 0 && <span className="unread-dot">{unread}</span>}
      </button>

      <div className={`chat-panel${open ? " open" : ""}`} role="dialog" aria-label={t.name} aria-hidden={!open}>
        <div className="chat-head">
          <LogoMark size={38} />
          <div>
            <strong>{human ? t.paul : t.name}</strong>
            <span><i className="dot" /> {human ? t.humanStatus : t.status}</span>
          </div>
          <button onClick={() => setOpen(false)} aria-label={t.close}><Icon name="close" size={20} /></button>
        </div>

        <div className="chat-body" ref={bodyRef}>
          <div className="bubble bot">{t.greeting}</div>
          {msgs.map((m, i) => (
            <div key={i} className={`bubble ${m.from}`}>
              {m.from === "paul" && <b className="bubble-name">{t.paul}</b>}
              {m.text}
              {m.actions && i === msgs.length - 1 && step === "idle" && !human && (
                <span className="bubble-actions">
                  {m.actions.map((a) => (
                    <button key={a} className={a === "pickDate" || a === "talkToPaul" ? "primary" : ""} onClick={() => act(a)}>{t[a]}</button>
                  ))}
                </span>
              )}
            </div>
          ))}
          {typing && <div className="bubble bot typing"><span /><span /><span /></div>}
          {human && step === "idle" && !typing && last?.from === "user" && <p className="chat-note">{t.waiting}</p>}
          {step === "idle" && !typing && !human && (
            <div className="chips">
              {t.quick.map((q) => <button key={q} onClick={() => send(q)}>{q}</button>)}
            </div>
          )}
        </div>

        <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(input); }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={placeholder} aria-label={placeholder} maxLength={1000} />
          <button aria-label={t.send} disabled={!input.trim()}><Icon name="send" size={18} /></button>
        </form>
      </div>
    </>
  );
}
