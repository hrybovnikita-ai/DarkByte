"use client";

import { useCallback, useState } from "react";
import { useDismissable } from "@/components/chat/useDismissable";

type Props = {
  pinned: boolean;
  onRename: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
};

export default function ConversationHistoryMenu({ pinned, onRename, onTogglePin, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const close = useCallback(() => {
    setOpen(false);
    setConfirmDelete(false);
  }, []);
  const rootRef = useDismissable(open, close);

  return (
    <div className="chat-history-menu" ref={rootRef}>
      <button
        type="button"
        className="chat-more-btn"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
          setConfirmDelete(false);
        }}
      >
        ⋯
      </button>
      {open && (
        <div
          className="chat-menu"
          role="menu"
          onClick={(event) => event.stopPropagation()}
        >
          {confirmDelete ? (
            <>
              <p className="chat-menu-confirm-text">Delete this chat?</p>
              <button type="button" className="chat-menu-danger" role="menuitem" onClick={() => { onDelete(); close(); }}>
                Confirm delete
              </button>
              <button type="button" role="menuitem" onClick={() => setConfirmDelete(false)}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button type="button" role="menuitem" onClick={() => { onRename(); close(); }}>
                Rename chat
              </button>
              <button type="button" role="menuitem" onClick={() => { onTogglePin(); close(); }}>
                {pinned ? "Unpin chat" : "Pin chat"}
              </button>
              <button type="button" className="chat-menu-danger" role="menuitem" onClick={() => setConfirmDelete(true)}>
                Delete chat
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}