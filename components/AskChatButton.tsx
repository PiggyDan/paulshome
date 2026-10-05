"use client";

import Icon from "./Icon";
import type { OpenChatDetail } from "./ChatBot";

/** Opens the chatbot already set up to take a request for this service. */
export default function AskChatButton({ service, label, className = "button button-primary" }: { service: string; label: string; className?: string }) {
  const open = () => window.dispatchEvent(new CustomEvent<OpenChatDetail>("open-chat", { detail: { service } }));
  return (
    <button className={className} onClick={open}>
      <Icon name="chat" size={18} /> {label}
    </button>
  );
}
