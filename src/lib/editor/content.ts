import "server-only";
import { getSchema, type JSONContent } from "@tiptap/core";
import { generateHTML } from "@tiptap/html/server";
import { slugify } from "@/lib/slug";
import { contentExtensions } from "./extensions";

const schema = getSchema(contentExtensions);

export type TocItem = { id: string; text: string; level: number };

/** Rebuilds untrusted editor JSON through the schema, dropping unknown nodes and attributes. */
export function parseContent(raw: unknown) {
  const node = schema.nodeFromJSON(raw);
  node.check();
  return { json: node.toJSON() as JSONContent, text: node.textContent };
}

function textOf(node: JSONContent): string {
  if (node.text) return node.text;
  return (node.content ?? []).map(textOf).join("");
}

/** Renders sanitized HTML and assigns stable heading ids for the table of contents. */
export function renderArticle(raw: unknown) {
  const { json } = parseContent(raw);
  const toc: TocItem[] = [];
  const used = new Map<string, number>();

  const walk = (node: JSONContent) => {
    if (node.type === "heading") {
      const text = textOf(node).trim();
      const base = slugify(text, 60) || "section";
      const seen = used.get(base) ?? 0;
      used.set(base, seen + 1);
      const id = seen ? `${base}-${seen + 1}` : base;
      node.attrs = { ...node.attrs, id };
      if (text) toc.push({ id, text, level: Number(node.attrs.level ?? 2) });
    }
    node.content?.forEach(walk);
  };
  walk(json);

  return { html: generateHTML(json, contentExtensions), toc };
}
