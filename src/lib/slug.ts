export function slugify(value: string, maxLength = 80) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .slice(0, maxLength)
    .replace(/^-+|-+$/g, "");
}

export function normalizeTag(value: string) {
  return slugify(value.replace(/^#/, ""), 30);
}
