export const cacheTags = {
  posts: "posts",
  post: (username: string, slug: string) => `post:${username}/${slug}`,
  user: (username: string) => `user:${username}`,
};
