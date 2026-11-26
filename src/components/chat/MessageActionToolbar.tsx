"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  Check,
  Copy,
  GitBranch,
  MoreHorizontal,
  RefreshCw,
  Share2,
  Square,
  ThumbsDown,
  ThumbsUp,
  Volume2,
} from "lucide-react";
import { useDismissable } from "@/components/chat/useDismissable";

export type FeedbackRating = "GOOD" | "BAD";

type MessageActionToolbarProps = {
  messageId: string;
  content: string;
  createdAt: string;
  conversationId: string;
  feedbackRating: FeedbackRating | null;
  busy?: boolean;
  onFeedback: (rating: FeedbackRating) => Promise<void>;
  onRetry: () => Promise<void>;
  onBranch: () => Promise<void>;
  onCreateShare: () => Promise<{ url: string; shareId: string } | null>;
  onRevokeShare: (shareId: string) => Promise<void>;
};

function formatTimestamp(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function ToolbarButton({
  label,
  onClick,
  disabled,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`chat-toolbar-btn${active ? " chat-toolbar-btn-active" : ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

export default function MessageActionToolbar({
  messageId,
  content,
  createdAt,
  conversationId,
  feedbackRating,
  busy = false,
  onFeedback,
  onRetry,
  onBranch,
  onCreateShare,
  onRevokeShare,
}: MessageActionToolbarProps) {
  const feedbackMenuId = useId();
  const [copied, setCopied] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [shareStep, setShareStep] = useState<"idle" | "confirm" | "done">("idle");
  const [shareUrl, setShareUrl] = useState("");
  const [shareId, setShareId] = useState("");
  const [shareBusy, setShareBusy] = useState(false);
  const [speechState, setSpeechState] = useState<"idle" | "speaking">("idle");
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const feedbackRef = useDismissable(feedbackOpen, () => setFeedbackOpen(false));
  const moreRef = useDismissable(moreOpen, () => setMoreOpen(false));

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [messageId]);

  const plainText = content.replace(/[#*_`>\[\]()~-]/g, " ").replace(/\s+/g, " ").trim();

  async function copyResponse() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  async function pickFeedback(rating: FeedbackRating) {
    setFeedbackOpen(false);
    await onFeedback(rating);
  }

  function toggleSpeech() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (speechState === "speaking") {
      window.speechSynthesis.cancel();
      setSpeechState("idle");
      utteranceRef.current = null;
      return;
    }
    const utterance = new SpeechSynthesisUtterance(plainText || content);
    utterance.onend = () => setSpeechState("idle");
    utterance.onerror = () => setSpeechState("idle");
    utteranceRef.current = utterance;
    setSpeechState("speaking");
    window.speechSynthesis.speak(utterance);
  }

  const openShare = useCallback(() => {
    setShareStep("confirm");
    setShareUrl("");
    setFeedbackOpen(false);
    setMoreOpen(false);
  }, []);

  async function confirmShare() {
    setShareBusy(true);
    try {
      const result = await onCreateShare();
      if (result?.url) {
        setShareUrl(result.url);
        setShareId(result.shareId);
        setShareStep("done");
      } else {
        setShareStep("idle");
      }
    } finally {
      setShareBusy(false);
    }
  }

  async function copyShareUrl() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      /* ignore */
    }
  }

  const disabled = busy || shareBusy;

  return (
    <div className="chat-toolbar" data-message-id={messageId} data-conversation-id={conversationId}>
      <ToolbarButton label="Copy response" onClick={() => void copyResponse()} disabled={disabled}>
        {copied ? <Check className="chat-toolbar-icon chat-toolbar-icon-success" aria-hidden /> : <Copy className="chat-toolbar-icon" aria-hidden />}
      </ToolbarButton>

      <div className="chat-toolbar-dropdown-wrap" ref={feedbackRef}>
        <ToolbarButton
          label="Feedback"
          onClick={() => setFeedbackOpen((o) => !o)}
          disabled={disabled}
          active={feedbackRating != null}
        >
          {feedbackRating === "BAD" ? (
            <ThumbsDown className="chat-toolbar-icon" aria-hidden />
          ) : (
            <ThumbsUp className="chat-toolbar-icon" aria-hidden />
          )}
        </ToolbarButton>
        {feedbackOpen && (
          <form className="chat-toolbar-menu" role="menu" aria-labelledby={feedbackMenuId} onSubmit={(e) => e.preventDefault()}>
            <p id={feedbackMenuId} className="chat-toolbar-menu-title">Feedback</p>
            <button
              type="button"
              role="menuitem"
              className={`chat-toolbar-menu-item${feedbackRating === "GOOD" ? " is-selected" : ""}`}
              onClick={() => void pickFeedback("GOOD")}
            >
              <ThumbsUp size={14} aria-hidden />
              Good response
            </button>
            <button
              type="button"
              role="menuitem"
              className={`chat-toolbar-menu-item${feedbackRating === "BAD" ? " is-selected" : ""}`}
              onClick={() => void pickFeedback("BAD")}
            >
              <ThumbsDown size={14} aria-hidden />
              Bad response
            </button>
          </form>
        )}
      </div>

      <ToolbarButton
        label={speechState === "speaking" ? "Stop read aloud" : "Read aloud"}
        onClick={toggleSpeech}
        disabled={disabled}
        active={speechState === "speaking"}
      >
        {speechState === "speaking" ? (
          <Square className="chat-toolbar-icon" aria-hidden />
        ) : (
          <Volume2 className="chat-toolbar-icon" aria-hidden />
        )}
      </ToolbarButton>

      <ToolbarButton label="Share conversation" onClick={openShare} disabled={disabled}>
        <Share2 className="chat-toolbar-icon" aria-hidden />
      </ToolbarButton>

      <div className="chat-toolbar-dropdown-wrap" ref={moreRef}>
        <ToolbarButton label="More actions" onClick={() => setMoreOpen((o) => !o)} disabled={disabled}>
          <MoreHorizontal className="chat-toolbar-icon" aria-hidden />
        </ToolbarButton>
        {moreOpen && (
          <div className="chat-toolbar-menu" role="menu" aria-label="More actions">
            <p className="chat-toolbar-menu-meta">{formatTimestamp(createdAt)}</p>
            <button
              type="button"
              role="menuitem"
              className="chat-toolbar-menu-item"
              onClick={() => {
                setMoreOpen(false);
                void onRetry();
              }}
            >
              <RefreshCw size={14} aria-hidden />
              Retry
            </button>
            <button
              type="button"
              role="menuitem"
              className="chat-toolbar-menu-item"
              onClick={() => {
                setMoreOpen(false);
                void onBranch();
              }}
            >
              <GitBranch size={14} aria-hidden />
              Branch conversation
            </button>
          </div>
        )}
      </div>

      {shareStep !== "idle" && (
        <div className="chat-toolbar-share" role="dialog" aria-modal="true" aria-label="Share conversation">
          {shareStep === "confirm" && (
            <>
              <p className="chat-toolbar-share-text">
                Create a <strong>read-only</strong> link? Anyone with the link can view this conversation until it expires or you revoke it.
              </p>
              <div className="chat-toolbar-share-actions">
                <button type="button" className="chat-toolbar-share-cancel" onClick={() => setShareStep("idle")}>
                  Cancel
                </button>
                <button type="button" className="chat-toolbar-share-confirm" onClick={() => void confirmShare()} disabled={shareBusy}>
                  Create link
                </button>
              </div>
            </>
          )}
          {shareStep === "done" && (
            <>
              <p className="chat-toolbar-share-text">Share link ready (revocable from your account or API).</p>
              <div className="chat-toolbar-share-url">
                <input readOnly value={shareUrl} className="chat-toolbar-share-input" aria-label="Share URL" />
                <button type="button" className="chat-toolbar-share-copy" onClick={() => void copyShareUrl()}>
                  Copy
                </button>
              </div>
              <div className="chat-toolbar-share-actions">
                <button
                  type="button"
                  className="chat-toolbar-share-cancel"
                  onClick={() => {
                    if (shareId) void onRevokeShare(shareId);
                    setShareStep("idle");
                    setShareUrl("");
                    setShareId("");
                  }}
                >
                  Revoke link
                </button>
                <button type="button" className="chat-toolbar-share-confirm" onClick={() => setShareStep("idle")}>
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}