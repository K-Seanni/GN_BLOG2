import type { Metadata } from "next";
import { NOINDEX } from "@/lib/seo/metadata";

export const metadata: Metadata = { title: "블로그 주소 정하기", robots: NOINDEX };

export default function Layout({ children }: LayoutProps<"/onboarding">) {
  return children;
}
