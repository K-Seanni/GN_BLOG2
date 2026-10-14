import type { NextConfig } from "next";

// Next.js' default list plus link-preview and AI search crawlers that don't run JavaScript.
const HTML_LIMITED_BOTS = new RegExp(
  [
    "[\\w-]+-Google|Google-[\\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou",
    "bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot",
    "facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp",
    "SkypeUriPreview|Yeti|googleweblight",
    "kakaotalk-scrap|Daum|TelegramBot",
    "OAI-SearchBot|ChatGPT-User|GPTBot|Claude-SearchBot|Claude-User|ClaudeBot",
    "PerplexityBot|Perplexity-User|Amazonbot|meta-externalagent|CCBot|Bytespider",
  ].join("|"),
  "i",
);

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  htmlLimitedBots: HTML_LIMITED_BOTS,
  images: {
    remotePatterns: [
      new URL("https://lh3.googleusercontent.com/**"),
      new URL("https://edwodirddlcgqoydtaef.supabase.co/storage/v1/object/public/**"),
    ],
  },
  // Folders starting with "@" are reserved for parallel routes, so /@username maps to /u/username.
  async rewrites() {
    return [
      { source: "/@:username", destination: "/u/:username" },
      { source: "/@:username/feed.xml", destination: "/u/:username/feed.xml" },
      { source: "/@:username/:slug", destination: "/u/:username/:slug" },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
