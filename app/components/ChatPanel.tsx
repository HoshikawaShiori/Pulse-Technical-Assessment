"use client";

import { useEffect, useRef, useState } from "react";

export interface ChatMessage {
  id: number;
  mine: boolean;
  text: string;
}

export default function ChatPanel({
  messages,
  connected,
  videoBusy,
  peerName,
  onSend,
  onStartVideo,
  onEnd,
}: {
  messages: ChatMessage[];
  connected: boolean;
  videoBusy: boolean;
  peerName: string;
  onSend: (text: string) => void;
  onStartVideo: () => void;
  onEnd: () => void;
}) {
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !connected) return;
    onSend(text);
    setDraft("");
  }

  return (
    <div className="absolute inset-y-0 right-0 z-20 flex w-full max-w-md flex-col shadow-2xl" style={{ borderLeft: "1px solid var(--border)", background: "var(--surface)" }}>
      <header className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <div>
          <p className="font-semibold text-fg">{peerName}</p>
          <p className="text-xs text-fg-muted">
            {connected ? "Connected" : "Connecting…"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onStartVideo}
            disabled={!connected || videoBusy}
            className="rounded-full border px-3 py-1.5 text-sm transition-colors disabled:opacity-40"
            style={{ borderColor: "var(--border-strong)", color: "var(--fg-subtle)" }}
          >
            Video
          </button>
          <button
            onClick={onEnd}
            className="rounded-full bg-danger px-3 py-1.5 text-sm font-medium text-white hover:opacity-80"
          >
            End
          </button>
        </div>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="mt-8 text-center text-sm text-fg-muted">
            No messages yet. Conversation history is restored when you reconnect with this user.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.mine ? "justify-end" : "justify-start"}`}
          >
            <span
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                m.mine
                  ? "bg-brand text-brand-on"
                  : "text-fg"
              }`}
              style={!m.mine ? { background: "var(--surface-alt)" } : undefined}
            >
              {m.text}
            </span>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form onSubmit={submit} className="flex gap-2 p-3" style={{ borderTop: "1px solid var(--border)" }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={connected ? "Type a message…" : "Connecting…"}
          disabled={!connected}
          className="flex-1 rounded-full bg-bg-input px-4 py-2 text-sm text-fg outline-none placeholder:text-fg-muted focus:ring-1 focus:ring-brand disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!connected || !draft.trim()}
          className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-on disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}