import { getIndexablePosts } from "@/lib/data/public";
import { buildRss, rssResponse } from "@/lib/seo/rss";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo/site";

export async function GET() {
  const posts = await getIndexablePosts(30);
  return rssResponse(
    buildRss({ title: SITE_NAME, description: SITE_DESCRIPTION, path: "/feed.xml", posts }),
  );
}
