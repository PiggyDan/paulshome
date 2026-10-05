"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "./Icon";
import { LogoMark } from "./Logo";
import { useLang } from "./Prefs";
import { fmt, PHONE, type Dict } from "@/lib/i18n";

type Action = "pickDate" | "leaveDetails";
type Msg = { from: "bot" | "user"; text: string; actions?: Action[] };
type Step = "idle" | "name" | "phone" | "job";

/** Detail passed with the "open-chat" event, e.g. from a service page. */
export type OpenChatDetail = { service?: string };

type Topic = "urgent" | "price" | "area" | "hours" | "about" | "wood" | "winter" | "services" | "thanks" | "hi";

// Keywords in English and Mongolian, so either language is understood whichever UI language is on.
const TOPICS: [Topic | "BOOK", string[]][] = [
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

function answer(input: string, t: Dict["chat"], serviceTitles: string[]): string | "BOOK" {
  const q = ` ${input.toLowerCase()} `;
  const topic = TOPICS.find(([, words]) => words.some((w) => q.includes(w)))?.[0];
  if (topic === "BOOK") return "BOOK";
  if (!topic) return fmt(t.fallback, { phone: PHONE });
  return fmt(t[topic], { phone: PHONE, list: serviceTitles.slice(0, 8).join(", ") });
}

export default function ChatBot({ serviceTitles }: { serviceTitles: string[] }) {
  const { t: dict } = useLang();
  const t = dict.chat;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [lead, setLead] = useState({ name: "", phone: "", service: "" });
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const stepRef = useRef(step);
  stepRef.current = step;

  const botSay = (text: string, actions?: Action[]) => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { from: "bot", text, actions }]);
    }, 450);
  };

  const act = (action: Action) => {
    if (action === "leaveDetails") {
      setMsgs((m) => [...m, { from: "user", text: t.leaveDetails }]);
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
  }, [t]);

  useEffect(() => {
    document.body.classList.toggle("chat-open", open);
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing, open]);

  async function send(raw: string) {
    const text = raw.trim();
    if (!text) return;
    setInput("");
    setMsgs((m) => [...m, { from: "user", text }]);

    if (step === "name") {
      setLead((l) => ({ ...l, name: text }));
      setStep("phone");
      return botSay(fmt(t.askPhone, { name: text }));
    }
    if (step === "phone") {
      setLead((l) => ({ ...l, phone: text }));
      setStep("job");
      return botSay(lead.service ? fmt(t.askJobService, { service: lead.service }) : t.askJob);
    }
    if (step === "job") {
      setStep("idle");
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: lead.name, phone: lead.phone, service: lead.service, message: text, source: "chat" }),
      }).catch(() => null);
      setLead({ name: "", phone: "", service: "" });
      return botSay(res?.ok ? t.done : fmt(t.fail, { phone: PHONE }));
    }

    const reply = answer(text, t, serviceTitles);
    if (reply === "BOOK") return botSay(t.bookChoice, ["pickDate", "leaveDetails"]);
    botSay(reply);
  }

  const placeholder = step === "phone" ? t.phPhonePlaceholder : step === "name" ? t.phNamePlaceholder : t.placeholder;

  return (
    <>
      <button className={`chat-fab${open ? " hidden" : ""}`} onClick={() => setOpen(true)} aria-label={t.open}>
        <Icon name="chat" size={24} />
        <span className="chat-fab-label">{t.fab}</span>
      </button>

      <div className={`chat-panel${open ? " open" : ""}`} role="dialog" aria-label={t.name} aria-hidden={!open}>
        <div className="chat-head">
          <LogoMark size={38} />
          <div>
            <strong>{t.name}</strong>
            <span><i className="dot" /> {t.status}</span>
          </div>
          <button onClick={() => setOpen(false)} aria-label={t.close}><Icon name="close" size={20} /></button>
        </div>

        <div className="chat-body">
          <div className="bubble bot">{t.greeting}</div>
          {msgs.map((m, i) => (
            <div key={i} className={`bubble ${m.from}`}>
              {m.text}
              {m.actions && i === msgs.length - 1 && step === "idle" && (
                <span className="bubble-actions">
                  {m.actions.map((a) => (
                    <button key={a} className={a === "pickDate" ? "primary" : ""} onClick={() => act(a)}>{t[a]}</button>
                  ))}
                </span>
              )}
            </div>
          ))}
          {typing && <div className="bubble bot typing"><span /><span /><span /></div>}
          {step === "idle" && !typing && (
            <div className="chips">
              {t.quick.map((q) => <button key={q} onClick={() => send(q)}>{q}</button>)}
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(input); }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
          <button aria-label={t.send} disabled={!input.trim()}><Icon name="send" size={18} /></button>
        </form>
      </div>
    </>
  );
}
