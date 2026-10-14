export const SITE_NAME = "GN Blog";
export const SITE_TITLE = "GN Blog — 생각을 기록하고, 함께 나누는 공간";
export const SITE_DESCRIPTION =
  "코드처럼 정확하게, 글처럼 자유롭게. 개발자와 메이커를 위한 미니멀 블로그 플랫폼. Google 계정으로 3초 만에 시작하세요.";
export const SITE_LOCALE = "ko_KR";
export const SITE_LANGUAGE = "ko-KR";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export function absoluteUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}

export const DEFAULT_OG_IMAGE = {
  url: absoluteUrl("/opengraph-image"),
  width: 1200,
  height: 630,
  alt: SITE_TITLE,
};
