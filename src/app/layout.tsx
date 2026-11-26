import type { Metadata } from "next";

import "@fontsource/press-start-2p";
import "@fontsource/vt323";

import "./globals.css";
import { AppAuthProvider } from "@/contexts/AppAuthProvider";
import { getAuthProviderMode } from "@/server/auth/provider";

export const metadata: Metadata = {
  title: "DARKBYTE — Enter the Dark Side",
  description:
    "A digital universe where horror, pixel art and artificial intelligence collide.",
  applicationName: "DARKBYTE",
  keywords: [
    "DarkByte",
    "Horror",
    "Pixel Art",
    "Artificial Intelligence",
    "Gaming",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authMode = getAuthProviderMode();
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="antialiased">
        <AppAuthProvider mode={authMode}>{children}</AppAuthProvider>
      </body>
    </html>
  );
}
