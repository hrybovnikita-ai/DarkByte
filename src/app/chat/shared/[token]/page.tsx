import { Suspense } from "react";
import SharedChatPageClient from "./SharedChatPageClient";

export const instant = false;

export default function SharedChatPage() {
  return (
    <Suspense fallback={<div className="chat-shell-loading">Loading shared chat…</div>}>
      <SharedChatPageClient />
    </Suspense>
  );
}