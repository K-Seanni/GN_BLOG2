import type { Metadata } from "next";
import { NOINDEX } from "@/lib/seo/metadata";

export const metadata: Metadata = { title: "설정", robots: NOINDEX };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
