import Heading from "@tiptap/extension-heading";
import Image from "@tiptap/extension-image";
import StarterKit from "@tiptap/starter-kit";

const HeadingWithId = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("id"),
        renderHTML: (attributes) => (attributes.id ? { id: attributes.id } : {}),
      },
    };
  },
});

export const contentExtensions = [
  StarterKit.configure({
    heading: false,
    link: {
      openOnClick: false,
      autolink: true,
      defaultProtocol: "https",
      HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
    },
  }),
  HeadingWithId.configure({ levels: [2, 3] }),
  Image,
];

export const EMPTY_DOC = { type: "doc", content: [] };
