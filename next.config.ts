import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
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
