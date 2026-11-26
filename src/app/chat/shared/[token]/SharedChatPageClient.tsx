"use client";

import { useParams } from "next/navigation";
import SiteHeader from "@/components/layout/SiteHeader";
import SharedChatView from "@/components/chat/SharedChatView";

export default function SharedChatPageClient() {
  const params = useParams();
  const token = typeof params.token === "string" ? params.token : "";
  return (
    <div className="chat-page text-white">
      <SiteHeader />
      <SharedChatView token={token} />
    </div>
  );
}