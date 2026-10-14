import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

const description =
  "코드처럼 정확하게, 글처럼 자유롭게. 개발자와 메이커를 위한 미니멀 블로그 플랫폼. Google 계정으로 3초 만에 시작하세요.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "GN Blog — 생각을 기록하고, 함께 나누는 공간",
    template: "%s | GN Blog",
  },
  description,
  applicationName: "GN Blog",
  keywords: ["블로그", "개발자 블로그", "기술 블로그", "글쓰기", "GN Blog"],
  openGraph: {
    type: "website",
    siteName: "GN Blog",
    locale: "ko_KR",
    title: "GN Blog — 생각을 기록하고, 함께 나누는 공간",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "GN Blog — 생각을 기록하고, 함께 나누는 공간",
    description,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 font-sans dark:bg-black">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
