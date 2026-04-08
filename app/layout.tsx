import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "./globals.css";

const fontVariables = {
  "--font-noto-sans-jp":
    '"Hiragino Sans", "Yu Gothic", "Meiryo", system-ui, sans-serif',
  "--font-geist-mono":
    '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
} as CSSProperties;

export const metadata: Metadata = {
  title: "BloomLog",
  description: "万博の来場日ごとの思い出を記録して振り返れるアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased" style={fontVariables}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
