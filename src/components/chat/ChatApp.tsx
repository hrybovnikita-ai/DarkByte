"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api-fetch";
import MarkdownMessage from "@/components/chat/MarkdownMessage";
import MessageActionToolbar, { type FeedbackRating } from "@/components/chat/MessageActionToolbar";
import PixelSkull from "@/components/chat/PixelSkull";

type ConversationSummary = { id: string; title: string | null; modelId: string; updatedAt: string; createdAt: string };
type ChatMessage = {
  id: string;
  role: string;
  content: string;
  modelId?: string | null;
  createdAt: string;
  feedbackRating?: FeedbackRating | null;
};
type ModelOption = { id: string; label: string; provider: string; creditCost: number; configured: boolean };

function apiFailureMessage(body: unknown, fallback: string) {
  if (!body || typeof body !== "object" || !("error" in body)) return fallback;
  const err = (body as { error?: { message?: string; code?: string } }).error;
  if (err?.code === "INSUFFICIENT_CREDITS") {
    return `Not enough credits (need more CR). Visit Pricing on the home page to buy a pack.`;
  }
  return err?.message ?? fallback;
}

const PROMPTS = [
  { label: "Write code", text: "Write a small TypeScript utility for parsing horror-themed pixel coordinates." },
  { label: "Horror story", text: "Write a short horror story set in the DARKBYTE Ocean Abyss world." },
  { label: "Game ideas", text: "Suggest three retro horror mini-game ideas with pixel-art mechanics." },
  { label: "Ask anything", text: "What can DARKBYTE AI help me build today?" },
];

function consumeSseBlock(block: string, onEvent: (event: string, data: unknown) => void) {
  if (!block.trim()) return;
  let event = "message";
  let dataRaw = "";
  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    if (line.startsWith("data:")) dataRaw += line.slice(5).trim();
  }
  if (!dataRaw) return;
  try { onEvent(event, JSON.parse(dataRaw)); } catch { /* ignore */ }
}

export default function ChatApp() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [modelId, setModelId] = useState("openai/gpt-oss-20b");
  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [error, setError] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const activeModel = useMemo(() => models.find((m) => m.id === modelId), [models, modelId]);

  useEffect(() => {
    if (!loading && !user) router.replace("/sign-in?callbackUrl=/chat");
  }, [loading, user, router]);

  const bootstrapForUserId = useRef<string | null>(null);

  const redirectToSignIn = useCallback(() => {
    bootstrapForUserId.current = null;
    router.replace("/sign-in?callbackUrl=/chat");
  }, [router]);

  const loadModels = useCallback(async () => {
    const response = await apiFetch("/api/chat/models", { cache: "no-store" });
    if (response.status === 401) {
      redirectToSignIn();
      return;
    }
    const body = await response.json();
    if (body.success) {
      setModels(body.data.models);
      const firstConfigured = body.data.models.find((m: ModelOption) => m.configured);
      if (firstConfigured) setModelId((prev) => body.data.models.some((m: ModelOption) => m.id === prev && m.configured) ? prev : firstConfigured.id);
    }
  }, [redirectToSignIn]);

  const loadConversations = useCallback(async (query = search) => {
    const url = query.trim() ? `/api/chat/conversations?search=${encodeURIComponent(query.trim())}` : "/api/chat/conversations";
    const response = await apiFetch(url, { cache: "no-store" });
    if (response.status === 401) {
      redirectToSignIn();
      return;
    }
    const body = await response.json();
    if (body.success) setConversations(body.data.items);
  }, [search, redirectToSignIn]);

  const loadConversation = useCallback(async (id: string) => {
    const response = await apiFetch(`/api/chat/conversations/${id}`, { cache: "no-store" });
    if (response.status === 401) {
      redirectToSignIn();
      return;
    }
    const body = await response.json();
    if (!body.success) {
      setError(apiFailureMessage(body, "Could not load conversation"));
      return;
    }
    setActiveId(id);
    setMessages(body.data.messages);
    setModelId(body.data.modelId);
    setMobileSidebar(false);
  }, [redirectToSignIn]);

  useEffect(() => {
    if (!user?.id) return;
    if (bootstrapForUserId.current === user.id) return;
    bootstrapForUserId.current = user.id;
    void Promise.all([loadModels(), loadConversations()]);
  }, [user?.id, loadModels, loadConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamText, streaming]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [input]);

  async function newChat() {
    setError("");
    const response = await apiFetch("/api/chat/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId }),
    });
    const body = await response.json();
    if (!body.success) {
      setError(apiFailureMessage(body, "Could not create chat"));
      return;
    }
    setConversations((prev) => [body.data, ...prev]);
    setActiveId(body.data.id);
    setMessages([]);
    setStreamText("");
    setMobileSidebar(false);
  }

  async function removeChat(id: string) {
    const response = await apiFetch(`/api/chat/conversations/${id}`, { method: "DELETE" });
    if (!response.ok && response.status !== 204) {
      setError("Could not delete conversation");
      return;
    }
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      setActiveId(null);
      setMessages([]);
    }
  }

  async function saveRename(id: string) {
    const title = renameValue.trim();
    if (!title) return;
    const response = await apiFetch(`/api/chat/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    const body = await response.json();
    if (body.success) {
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
      setRenaming(null);
    }
  }

  async function sendMessage(content: string) {
    if (!content.trim() || streaming) return;
    let conversationId = activeId;
    if (!conversationId) {
      const created = await apiFetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId }),
      });
      const createdBody = await created.json();
      if (!createdBody.success) {
        setError(apiFailureMessage(createdBody, "Could not start chat"));
        return;
      }
      conversationId = createdBody.data.id;
      setConversations((prev) => [createdBody.data, ...prev]);
      setActiveId(conversationId);
    }

    const optimisticUser: ChatMessage = {
      id: `temp-user-${crypto.randomUUID()}`,
      role: "user",
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUser]);
    setInput("");
    setStreaming(true);
    setStreamText("");
    setError("");
    abortRef.current = new AbortController();

    try {
      const response = await apiFetch(`/api/chat/conversations/${conversationId}/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), modelId }),
        signal: abortRef.current.signal,
      });

      if (!response.ok || !response.body) {
        const body = await response.json().catch(() => null);
        throw new Error(apiFailureMessage(body, "Streaming failed"));
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistant = "";
      let userId = optimisticUser.id;
      let assistantId = `temp-assistant-${crypto.randomUUID()}`;
      let streamError: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          consumeSseBlock(part, (event, data) => {
            if (event === "user" && data && typeof data === "object" && "id" in data) {
              userId = String((data as { id: string }).id);
            }
            if (event === "token" && data && typeof data === "object" && "t" in data) {
              assistant += String((data as { t: string }).t);
              setStreamText(assistant);
            }
            if (event === "error" && data && typeof data === "object" && "message" in data) {
              streamError = String((data as { message: string }).message);
            }
            if (event === "done" && data && typeof data === "object" && "assistantId" in data) {
              assistantId = String((data as { assistantId: string }).assistantId);
              window.dispatchEvent(new Event("credits-updated"));
            }
          });
        }
      }
      if (buffer.trim()) consumeSseBlock(buffer, (event, data) => {
        if (event === "token" && data && typeof data === "object" && "t" in data) {
          assistant += String((data as { t: string }).t);
        }
        if (event === "error" && data && typeof data === "object" && "message" in data) {
          streamError = String((data as { message: string }).message);
        }
      });

      if (streamError) throw new Error(streamError);
      if (!assistant.trim()) throw new Error("The model returned an empty response. Try Groq or another model.");

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimisticUser.id),
        { ...optimisticUser, id: userId },
        { id: assistantId, role: "assistant", content: assistant, modelId, createdAt: new Date().toISOString() },
      ]);
      setStreamText("");
      void loadConversations();
    } catch (reason) {
      if (reason instanceof Error && reason.name === "AbortError") {
        setError("Generation stopped.");
      } else {
        setError(reason instanceof Error ? reason.message : "Message failed");
      }
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
      if (conversationId) void loadConversation(conversationId);
      setStreamText("");
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function stopGeneration() {
    abortRef.current?.abort();
  }

  async function submitFeedback(messageId: string, rating: FeedbackRating) {
    const response = await apiFetch(`/api/chat/messages/${messageId}/feedback`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating }),
    });
    if (response.status === 401) {
      redirectToSignIn();
      return;
    }
    const body = await response.json();
    if (!body.success) {
      setError(apiFailureMessage(body, "Could not save feedback"));
      return;
    }
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, feedbackRating: rating } : m)));
  }

  async function revokeShareLink(shareId: string) {
    if (!activeId) return;
    await apiFetch(`/api/chat/conversations/${activeId}/share/${shareId}`, { method: "DELETE" });
  }

  async function createShareLink() {
    if (!activeId) return null;
    const response = await apiFetch(`/api/chat/conversations/${activeId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: true }),
    });
    if (response.status === 401) {
      redirectToSignIn();
      return null;
    }
    const body = await response.json();
    if (!body.success) {
      setError(apiFailureMessage(body, "Could not create share link"));
      return null;
    }
    return { url: String(body.data.url), shareId: String(body.data.shareId) };
  }

  async function branchFromMessage(fromMessageId: string) {
    if (!activeId || streaming) return;
    const response = await apiFetch(`/api/chat/conversations/${activeId}/branch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromMessageId }),
    });
    if (response.status === 401) {
      redirectToSignIn();
      return;
    }
    const body = await response.json();
    if (!body.success) {
      setError(apiFailureMessage(body, "Could not branch conversation"));
      return;
    }
    setConversations((prev) => [body.data, ...prev]);
    await loadConversation(body.data.id);
  }

  async function retryAssistant(assistantMessageId: string) {
    if (!activeId || streaming) return;
    const assistantIndex = messages.findIndex((m) => m.id === assistantMessageId);
    if (assistantIndex < 0) return;

    setMessages((prev) => prev.slice(0, assistantIndex));
    setStreaming(true);
    setStreamText("");
    setError("");
    abortRef.current = new AbortController();

    try {
      const response = await apiFetch(`/api/chat/conversations/${activeId}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assistantMessageId, modelId }),
        signal: abortRef.current.signal,
      });

      if (!response.ok || !response.body) {
        const body = await response.json().catch(() => null);
        throw new Error(apiFailureMessage(body, "Regeneration failed"));
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistant = "";
      let assistantId = `temp-assistant-${crypto.randomUUID()}`;
      let streamError: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          consumeSseBlock(part, (event, data) => {
            if (event === "token" && data && typeof data === "object" && "t" in data) {
              assistant += String((data as { t: string }).t);
              setStreamText(assistant);
            }
            if (event === "error" && data && typeof data === "object" && "message" in data) {
              streamError = String((data as { message: string }).message);
            }
            if (event === "done" && data && typeof data === "object" && "assistantId" in data) {
              assistantId = String((data as { assistantId: string }).assistantId);
              window.dispatchEvent(new Event("credits-updated"));
            }
          });
        }
      }

      if (streamError) throw new Error(streamError);
      if (!assistant.trim()) throw new Error("The model returned an empty response.");

      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: assistant, modelId, createdAt: new Date().toISOString() },
      ]);
      setStreamText("");
      void loadConversations();
    } catch (reason) {
      if (reason instanceof Error && reason.name === "AbortError") {
        setError("Generation stopped.");
      } else {
        setError(reason instanceof Error ? reason.message : "Regeneration failed");
      }
      if (activeId) void loadConversation(activeId);
      setStreamText("");
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  if (loading || !user) {
    return <div className="chat-shell-loading">Loading chat…</div>;
  }

  const showWelcome = messages.length === 0 && !streaming && !streamText;

  return (
    <div className="chat-shell">
      {mobileSidebar && <button type="button" className="chat-backdrop" aria-label="Close sidebar" onClick={() => setMobileSidebar(false)} />}
      <aside
        className={`chat-sidebar ${sidebarOpen ? "" : "chat-sidebar-collapsed"} ${mobileSidebar ? "chat-sidebar-mobile-open" : ""}`}
        aria-hidden={!sidebarOpen && !mobileSidebar}
      >
        <div className="chat-sidebar-head">
          <button type="button" className="chat-new-btn" onClick={() => void newChat()}>+ NEW CHAT</button>
          <button type="button" className="chat-icon-btn lg:hidden" onClick={() => setMobileSidebar(false)} aria-label="Close sidebar">×</button>
        </div>
        <label className="chat-search-wrap">
          <span className="sr-only">Search conversations</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void loadConversations(search); }}
            placeholder="Search chats…"
            className="chat-search"
          />
        </label>
        <p className="chat-sidebar-label">CHAT HISTORY</p>
        <ul className="chat-history">
          {conversations.map((item) => (
            <li key={item.id} className={item.id === activeId ? "chat-history-active" : ""}>
              {renaming === item.id ? (
                <div className="chat-rename-row">
                  <input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} className="chat-rename-input" />
                  <button type="button" onClick={() => void saveRename(item.id)}>Save</button>
                </div>
              ) : (
                <div className="chat-history-row">
                  <button type="button" className="chat-history-btn" onClick={() => void loadConversation(item.id)}>
                    {item.title ?? "New conversation"}
                  </button>
                  <ConversationMenu
                    onRename={() => { setRenaming(item.id); setRenameValue(item.title ?? ""); }}
                    onDelete={() => void removeChat(item.id)}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
        <div className="chat-sidebar-foot">
          <Link href="/account" className="text-xs text-zinc-500 hover:text-red-400">Settings</Link>
        </div>
      </aside>

      <section className="chat-main">
        <div className="chat-main-toolbar">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="chat-icon-btn hidden lg:inline-flex"
              onClick={() => setSidebarOpen((o) => !o)}
              aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              ☰
            </button>
            <button
              type="button"
              className="chat-icon-btn lg:hidden"
              onClick={() => setMobileSidebar(true)}
              aria-label="Open chat history"
            >
              ☰
            </button>
            <span className="text-sm text-zinc-400">DarkByte AI</span>
          </div>
          <span className="chat-online"><span aria-hidden="true" /> ONLINE</span>
        </div>

        <div className="chat-messages">
          <div className={`chat-messages-inner ${showWelcome ? "chat-messages-inner--welcome" : ""}`}>
          {showWelcome ? (
            <div className="chat-welcome">
              <PixelSkull />
              <h1 className="pixel-font mt-8 text-3xl text-red-500">DARKBYTE AI</h1>
              <p className="mt-3 text-zinc-400">What do you want to explore today?</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {PROMPTS.map((prompt) => (
                  <button
                    key={prompt.label}
                    type="button"
                    className="chat-prompt"
                    onClick={() => void sendMessage(prompt.text)}
                  >
                    {prompt.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <article key={message.id} className={`chat-bubble chat-bubble-${message.role}`}>
                  <p className="chat-bubble-label">{message.role === "user" ? "You" : "DARKBYTE AI"}</p>
                  {message.role === "assistant" ? (
                    <>
                      <MarkdownMessage content={message.content} />
                      {!message.id.startsWith("temp-") && activeId && (
                        <MessageActionToolbar
                          messageId={message.id}
                          content={message.content}
                          createdAt={message.createdAt}
                          conversationId={activeId}
                          feedbackRating={message.feedbackRating ?? null}
                          busy={streaming}
                          onFeedback={(rating) => submitFeedback(message.id, rating)}
                          onRetry={() => retryAssistant(message.id)}
                          onBranch={() => branchFromMessage(message.id)}
                          onCreateShare={() => createShareLink()}
                          onRevokeShare={(shareId) => revokeShareLink(shareId)}
                        />
                      )}
                    </>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </article>
              ))}
              {streaming && streamText && (
                <article className="chat-bubble chat-bubble-assistant">
                  <p className="chat-bubble-label">DARKBYTE AI</p>
                  <MarkdownMessage content={streamText} />
                  <p className="mt-2 text-xs text-red-400">Streaming…</p>
                </article>
              )}
            </>
          )}
          <div ref={bottomRef} />
          </div>
        </div>

        <div className="chat-composer-wrap">
          {error && <p role="alert" className="chat-error">{error}</p>}
          <div className="chat-composer">
            <textarea
              ref={textareaRef}
              value={input}
              rows={1}
              disabled={streaming}
              placeholder="Message DarkByte AI…"
              className="chat-textarea"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage(input);
                }
              }}
            />
            <div className="chat-composer-actions">
              <select
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                className="chat-model-select"
                disabled={streaming}
                aria-label="AI model"
              >
                {models.map((model) => (
                  <option key={model.id} value={model.id} disabled={!model.configured}>
                    {model.label}{!model.configured ? " (unavailable)" : ` · ${model.creditCost} CR`}
                  </option>
                ))}
              </select>
              {streaming ? (
                <button type="button" className="chat-stop-btn" onClick={stopGeneration}>Stop</button>
              ) : (
                <button type="button" className="chat-send-btn" onClick={() => void sendMessage(input)} disabled={!input.trim()}>Send ↑</button>
              )}
            </div>
          </div>
          <p className="chat-composer-foot">
            DARKBYTE AI // {activeModel ? `${activeModel.label} · ${activeModel.creditCost} CR/msg` : "Artificial Intelligence System"}
          </p>
        </div>
      </section>
    </div>
  );
}

function ConversationMenu({ onRename, onDelete }: { onRename: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" className="chat-more-btn" onClick={() => setOpen((o) => !o)} aria-label="Conversation actions">⋯</button>
      {open && (
        <div className="chat-menu">
          <button type="button" onClick={() => { onRename(); setOpen(false); }}>Rename</button>
          <button type="button" onClick={() => { onDelete(); setOpen(false); }}>Delete</button>
        </div>
      )}
    </div>
  );
}