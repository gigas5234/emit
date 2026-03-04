import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "E.M.I.T",
  description: "AI mentoring app — Emotions Mentored In Time.",
};

export const viewport = {
  themeColor: "#050616",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}

