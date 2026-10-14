import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { getPublishedPost } from "@/lib/data/public";

const SIZE = { width: 1200, height: 630 };
const LINE = "rgba(0,0,0,0.07)";

async function loadKoreanFont(text: string) {
  try {
    const css = await (
      await fetch(
        `https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@700&text=${encodeURIComponent(text)}`,
      )
    ).text();
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    return url ? await (await fetch(url)).arrayBuffer() : null;
  } catch {
    return null;
  }
}

function titleSize(title: string) {
  if (title.length <= 16) return 84;
  if (title.length <= 32) return 68;
  return 54;
}

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("u") ?? "";
  const slug = request.nextUrl.searchParams.get("s") ?? "";
  const post = username && slug ? await getPublishedPost(username, slug) : null;

  const title = post?.title ?? "GN Blog";
  const author = post ? (post.author.full_name ?? post.author.username) : "";
  const handle = post ? `@${post.author.username}` : "";
  const tags = (post?.tags ?? []).slice(0, 3).map((t) => `#${t}`).join("  ");
  const font = await loadKoreanFont(`gn/blog${title}${author}${handle}${tags}분 읽기0123456789`);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#fafafa",
          backgroundImage: `linear-gradient(${LINE} 1px, transparent 1px), linear-gradient(90deg, ${LINE} 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          color: "#0a0a0a",
          fontFamily: font ? "Noto Sans KR" : "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 32, fontWeight: 700 }}>
          <div style={{ width: 18, height: 18, background: "#0a0a0a", marginRight: 14 }} />
          gn/blog
        </div>

        <div
          style={{
            display: "flex",
            fontSize: titleSize(title),
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: -2,
            maxWidth: 1000,
          }}
        >
          {title.length > 60 ? `${title.slice(0, 59)}…` : title}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, color: "#52525b" }}>
          <span>{post ? `${author} ${handle}${post ? ` · ${post.reading_minutes}분 읽기` : ""}` : ""}</span>
          <span>{tags}</span>
        </div>
      </div>
    ),
    {
      ...SIZE,
      fonts: font ? [{ name: "Noto Sans KR", data: font, weight: 700, style: "normal" }] : undefined,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
