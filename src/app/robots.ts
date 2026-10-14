import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo/site";

const PRIVATE_PATHS = ["/write", "/edit/", "/onboarding", "/auth/", "/settings/"];

/** Crawlers that power AI search answers and cite sources. */
const AI_SEARCH_BOTS = ["OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User"];

/** Crawlers that collect model training data. Set to false to opt out of training. */
const ALLOW_AI_TRAINING = true;
const AI_TRAINING_BOTS = ["GPTBot", "ClaudeBot", "Google-Extended", "Applebot-Extended", "CCBot"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: AI_SEARCH_BOTS, allow: "/", disallow: PRIVATE_PATHS },
      ALLOW_AI_TRAINING
        ? { userAgent: AI_TRAINING_BOTS, allow: "/", disallow: PRIVATE_PATHS }
        : { userAgent: AI_TRAINING_BOTS, disallow: "/" },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
