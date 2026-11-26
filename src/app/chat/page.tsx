import SiteHeader from "@/components/layout/SiteHeader";
import ChatApp from "@/components/chat/ChatApp";

export default function ChatPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#080808] text-white">
      <SiteHeader />
      <ChatApp />
    </div>
  );
}