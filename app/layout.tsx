import type { Metadata, Viewport } from "next";
import { Roboto, Geist_Mono, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import SessionInitializer from "@/components/SessionInitializer";

const roboto = Roboto({
  variable: "--font-roboto",
  weight: ["400", "500", "700"],
  display: "swap",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-jp",
  weight: ["400", "500", "700"],
  display: "swap",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "オープンチームシート - 第6世代ポケモン対戦",
  description: "第6世代ポケモン対戦用オープンチームシートツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${roboto.variable} ${geistMono.variable} ${notoSansJP.variable} antialiased`}
      >
        <SessionInitializer />
        {children}
      </body>
    </html>
  );
}
