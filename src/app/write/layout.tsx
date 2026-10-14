import type { Metadata } from "next";
import { NOINDEX } from "@/lib/seo/metadata";

export const metadata: Metadata = { title: "새 글 쓰기", robots: NOINDEX };

export default function Layout({ children }: LayoutProps<"/write">) {
  return children;
}
