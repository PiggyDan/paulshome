"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";
import type { ChatMessage, ChatMeta } from "@/lib/chat-types";

type Thread = { meta: ChatMeta; messages: ChatMessage[] };

const JSON_HEADERS = { "Content-Type": "application/json" };
const nameOf = (m: ChatMeta) => m.name || `Visitor ${m.id.slice(0, 4).toUpperCase()}`;

function ago(iso: string) {
  const s = Math.max(0, (Date.now() - Date.parse(iso)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/** Paul's inbox: every website chat, with the bot's answers for context, and a reply box. */
export default function Chats() {
  const [list, setList] = useState<ChatMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [thread, setThread] = useState<Thread | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  const loadList = useCallback(async () => {
    const res = await fetch("/api/admin/chats", { cache: "no-store" }).catch(() => null);
    if (res?.ok) setList((await res.json()).chats);
    setLoading(false);
  }, []);

  const loadThread = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/chats/${id}`, { cache: "no-store" }).catch(() => null);
    if (!res?.ok) return;
    const j = (await res.json()) as Thread;
    setThread((cur) => (cur && cur.meta.id === id && cur.messages.length === j.messages.length ? { ...cur, meta: j.meta } : j));
    setList((l) => l.map((m) => (m.id === id ? { ...m, unread: 0 } : m)));
  }, []);

  useEffect(() => {
    loadList();
    const timer = setInterval(loadList, 8000);
    return () => clearInterval(timer);
  }, [loadList]);

  useEffect(() => {
    if (!activeId) return;
    loadThread(activeId);
    const timer = setInterval(() => loadThread(activeId), 4000);
    return () => clearInterval(timer);
  }, [activeId, loadThread]);

  useEffect(() => {
    // Scroll only the message list, never the page.
    const el = bodyRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [thread?.messages.length]);

  async function send() {
    const text = reply.trim();
    if (!text || !activeId || sending) return;
    setSending(true);
    const res = await fetch(`/api/admin/chats/${activeId}`, { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ text }) }).catch(() => null);
    setSending(false);
    if (!res?.ok) {
      alert((await res?.json().catch(() => null))?.error ?? "Could not send. Are you still signed in?");
      return;
    }
    setReply("");
    await loadThread(activeId);
    loadList();
  }

  async function remove() {
    if (!activeId || !confirm("Delete this conversation? The customer will no longer see it either.")) return;
    await fetch(`/api/admin/chats/${activeId}`, { method: "DELETE" });
    setActiveId(null);
    setThread(null);
    loadList();
  }

  const meta = thread?.meta;

  return (
    <>
      <h1>Chats</h1>
      <p className="muted">Conversations from the website chat. Customers see your replies in their chat window.</p>

      <div className={`chat-admin${activeId ? " has-thread" : ""}`}>
        <div className="chat-list table-card">
          {loading && <div className="empty">Loading…</div>}
          {!loading && list.length === 0 && <div className="empty">No chats yet.</div>}
          {list.map((c) => (
            <button key={c.id} className={`chat-item${c.id === activeId ? " on" : ""}${c.unread ? " unread" : ""}`} onClick={() => setActiveId(c.id)}>
              <span className="chat-avatar">{nameOf(c).slice(0, 1).toUpperCase()}</span>
              <span className="chat-item-text">
                <span className="chat-item-top">
                  <strong>{nameOf(c)}</strong>
                  <small>{ago(c.updatedAt)}</small>
                </span>
                <span className="chat-item-last">
                  {c.lastFrom === "paul" ? "You: " : c.lastFrom === "bot" ? "Bot: " : ""}{c.last}
                </span>
                {c.human && c.lastFrom === "user" && <span className="badge new">Wants to talk to you</span>}
              </span>
              {c.unread > 0 && <span className="unread-dot static">{c.unread}</span>}
            </button>
          ))}
        </div>

        <div className="chat-thread table-card">
          {!thread || !meta ? (
            <div className="empty">Pick a conversation.</div>
          ) : (
            <>
              <div className="thread-head">
                <button className="icon-btn thread-back" onClick={() => { setActiveId(null); setThread(null); }} aria-label="Back"><Icon name="back" size={16} /></button>
                <div>
                  <strong>{nameOf(meta)}</strong>
                  <small>
                    {meta.phone ? <a href={`tel:${meta.phone}`}><Icon name="phone" size={13} /> {meta.phone}</a> : "No phone shared"}
                    {" · "}{meta.lang === "mn" ? "Монгол" : "English"} · started {ago(meta.createdAt)}
                  </small>
                </div>
                <button className="button button-soft small danger" onClick={remove}>Delete</button>
              </div>

              <div className="thread-body" ref={bodyRef}>
                {thread.messages.map((m, i) => (
                  <div key={i} className={`tmsg ${m.from}`}>
                    {m.from !== "user" && <b>{m.from === "paul" ? "You" : "Bot"}</b>}
                    <span>{m.text}</span>
                    <time>{new Date(m.at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</time>
                  </div>
                ))}
              </div>

              {!meta.human && <p className="thread-note">The bot is answering this customer. Your reply takes over the chat.</p>}
              <form className="thread-reply" onSubmit={(e) => { e.preventDefault(); send(); }}>
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder="Write a reply… (Enter to send, Shift+Enter for a new line)"
                  rows={2}
                  maxLength={1000}
                />
                <button className="button button-primary" disabled={!reply.trim() || sending}><Icon name="send" size={16} /> Send</button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
