import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lead Finder | AI-Powered Instagram Lead Generation",
  description:
    "Find and reach beauty & hair salon owners on Instagram with AI-powered analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className="dark">
      <body className={inter.className}>
        <div className="min-h-screen gradient-bg">{children}</div>
      </body>
    </html>
  );
}
