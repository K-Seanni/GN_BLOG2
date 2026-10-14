import Image from "@tiptap/extension-image";
import StarterKit from "@tiptap/starter-kit";

export const contentExtensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    link: {
      openOnClick: false,
      autolink: true,
      defaultProtocol: "https",
      HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
    },
  }),
  Image,
];

export const EMPTY_DOC = { type: "doc", content: [] };
