import { Suspense } from "react";
import SiteHeader from "@/components/layout/SiteHeader";
import ChatApp from "@/components/chat/ChatApp";
import PixelSkeleton from "@/components/ui/PixelSkeleton";

export default function ChatPage() {
  return (
    <div className="chat-page text-white">
      <SiteHeader />
      <Suspense fallback={<div className="chat-shell-loading"><PixelSkeleton lines={3} /></div>}>
        <ChatApp />
      </Suspense>
    </div>
  );
}