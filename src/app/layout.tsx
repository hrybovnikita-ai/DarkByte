import type { Metadata } from "next";

import "@fontsource/press-start-2p";
import "@fontsource/vt323";

import "./globals.css";
import { AuthProvider } from "@/contexts/AuthProvider";

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
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
