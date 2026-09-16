import { useEffect, useRef, useState } from "react";
import type { ChatMessage, PlayerSessionId } from "@morichup/shared";
import { t } from "../i18n";

interface ChatPanelProps {
  messages: ChatMessage[];
  sessionId: PlayerSessionId;
  onSend: (text: string) => void;
}

/** Fase 8, US-801: chat di stanza, usata sia in lobby sia in partita (stesso componente). */
export default function ChatPanel({ messages, sessionId, onSend }: ChatPanelProps) {
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
  }

  return (
    <div className="chat-panel">
      <h3 className="section-label chat-panel__title">{t("chat.title")}</h3>
      <div className="chat-panel__messages" ref={listRef}>
        {messages.length === 0 && <p className="waiting-notice">{t("chat.noMessages")}</p>}
        {messages.map((message, i) => (
          <p key={i} className={`chat-panel__line${message.playerId === sessionId ? " chat-panel__line--mine" : ""}`}>
            <span className="chat-panel__author">{message.nickname}:</span> {message.text}
          </p>
        ))}
      </div>
      <form className="chat-panel__form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="text-input text-input--small"
          value={draft}
          maxLength={300}
          placeholder={t("chat.placeholder")}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="submit" className="btn btn--primary btn--small" disabled={!draft.trim()}>
          {t("chat.send")}
        </button>
      </form>
    </div>
  );
}
