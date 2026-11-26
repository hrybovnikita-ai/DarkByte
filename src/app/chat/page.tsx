import SiteHeader from "@/components/layout/SiteHeader";
import ChatApp from "@/components/chat/ChatApp";

export default function ChatPage() {
  return (
    <div className="chat-page text-white">
      <SiteHeader />
      <ChatApp />
    </div>
  );
}