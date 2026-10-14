import type { NextRequest } from "next/server";
import { getIndexablePosts, getPublicProfile } from "@/lib/data/public";
import { decodeParam } from "@/lib/posts";
import { buildRss, rssResponse } from "@/lib/seo/rss";
import { SITE_NAME } from "@/lib/seo/site";

export async function GET(_request: NextRequest, ctx: RouteContext<"/u/[username]/feed.xml">) {
  const { username } = await ctx.params;
  const author = await getPublicProfile(decodeParam(username).toLowerCase());
  if (!author) return new Response("Not found", { status: 404 });

  const name = author.full_name ?? author.username;
  const posts = await getIndexablePosts(30, author.id);

  return rssResponse(
    buildRss({
      title: `${name} (@${author.username}) | ${SITE_NAME}`,
      description: author.bio ?? `${name}님의 블로그`,
      path: `/@${author.username}/feed.xml`,
      posts,
    }),
  );
}
