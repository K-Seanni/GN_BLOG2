export const POST_CARD_SELECT =
  "id, title, slug, excerpt, summary, cover_image_url, tags, status, published_at, updated_at, view_count, like_count, comment_count, author:profiles!posts_author_id_fkey(username, full_name, avatar_url)";

export function postPath(username: string, slug: string) {
  return `/@${username}/${encodeURIComponent(slug)}`;
}

export function tagPath(tag: string) {
  return `/tags/${encodeURIComponent(tag)}`;
}

export function decodeParam(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
