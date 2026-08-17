import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "水視界｜公共溝通實驗室",
  description: "用三分鐘體驗資訊如何影響災害決策。",
  other: {
    "codex-preview": "development",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
