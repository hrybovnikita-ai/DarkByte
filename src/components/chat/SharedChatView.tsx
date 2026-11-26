"use client";

import { useEffect, useState } from "react";
import MarkdownMessage from "@/components/chat/MarkdownMessage";

type SharedMessage = { id: string; role: string; content: string; createdAt: string };

export default function SharedChatView({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("Shared conversation");
  const [messages, setMessages] = useState<SharedMessage[]>([]);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/chat/shared/${encodeURIComponent(token)}`, { cache: "no-store" });
        const body = await response.json();
        if (!body.success) {
          if (!cancelled) setError(body.error?.message ?? "This share link is unavailable.");
          return;
        }
        if (!cancelled) {
          setTitle(body.data.title ?? "Shared conversation");
          setMessages(body.data.messages ?? []);
          setExpiresAt(body.data.expiresAt ?? null);
        }
      } catch {
        if (!cancelled) setError("Could not load shared conversation.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return <div className="chat-shell-loading">Loading shared chat…</div>;
  }

  if (error) {
    return (
      <div className="chat-shell-loading">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="chat-shell">
      <section className="chat-main">
        <div className="chat-main-toolbar">
          <span className="text-sm text-zinc-400">Shared · read-only</span>
          {expiresAt && (
            <span className="text-xs text-zinc-500">
              Expires {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(expiresAt))}
            </span>
          )}
        </div>
        <div className="chat-messages">
          <div className="chat-messages-inner">
            <h1 className="mb-4 text-lg text-red-400">{title}</h1>
            {messages.map((message) => (
              <article key={message.id} className={`chat-bubble chat-bubble-${message.role}`}>
                <p className="chat-bubble-label">{message.role === "user" ? "User" : "DARKBYTE AI"}</p>
                {message.role === "assistant" ? (
                  <MarkdownMessage content={message.content} />
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}