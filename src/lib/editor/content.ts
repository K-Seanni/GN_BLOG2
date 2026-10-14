import "server-only";
import { getSchema, type JSONContent } from "@tiptap/core";
import { generateHTML } from "@tiptap/html/server";
import { contentExtensions } from "./extensions";

const schema = getSchema(contentExtensions);

/** Rebuilds untrusted editor JSON through the schema, dropping unknown nodes and attributes. */
export function parseContent(raw: unknown) {
  const node = schema.nodeFromJSON(raw);
  node.check();
  return { json: node.toJSON() as JSONContent, text: node.textContent };
}

export function renderContent(json: unknown) {
  return generateHTML(parseContent(json).json, contentExtensions);
}
