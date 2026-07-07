// Server-only markdown pipeline for thought-sandboxes posts.
// Obsidian-flavored: ![[wikilink]] image embeds resolve from the thoughts
// repo's attachments/ (mirrored to /content-art at build); GFM task lists;
// external links follow the site link policy (new tab + LinkGuard confirm
// when the label doesn't name the destination host).
import { Marked, type Tokens } from "marked";
import { attachmentUrl } from "./content";

export interface OutlineEntry {
  id: string;
  text: string;
}

const headingId = (text: string) =>
  text
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

/** Replace Obsidian ![[file]] embeds with figure/placeholder HTML before
 *  markdown parsing (raw HTML blocks pass through marked untouched). */
function resolveWikilinks(md: string): string {
  return md.replace(/!\[\[([^\]|]+?)(?:\|([^\]]+))?\]\]/g, (_, file, caption) => {
    const name = String(file).trim();
    const url = attachmentUrl(name);
    const label = escapeHtml(caption ?? name);
    if (url) {
      return `\n\n<figure class="post-embed"><img src="${url}" alt="${label}" loading="lazy" /><figcaption>${label}</figcaption></figure>\n\n`;
    }
    return `\n\n<figure class="post-embed post-embed-missing"><div class="post-embed-frame"><span>![[${escapeHtml(name)}]]</span><span class="post-embed-note">attachment not found in thoughts/attachments</span></div></figure>\n\n`;
  });
}

export function renderPost(md: string): {
  html: string;
  outline: OutlineEntry[];
} {
  const outline: OutlineEntry[] = [];
  const marked = new Marked({ gfm: true, breaks: false });
  marked.use({
    renderer: {
      heading({ tokens, depth }: Tokens.Heading) {
        const text = this.parser.parseInline(tokens);
        const id = headingId(text);
        // h2 AND h3 — vault notes often use ### as their top heading level
        if (depth === 2 || depth === 3)
          outline.push({ id, text: text.replace(/<[^>]+>/g, "") });
        return `<h${depth} id="${id}">${text}</h${depth}>\n`;
      },
      link({ href, tokens }: Tokens.Link) {
        const text = this.parser.parseInline(tokens);
        if (/^https?:\/\//.test(href)) {
          const plain = text.replace(/<[^>]+>/g, "").trim();
          const named = plain.toLowerCase().includes(hostOf(href));
          const confirm = named ? "" : ` data-confirm=""`;
          return `<a href="${href}" target="_blank" rel="noopener noreferrer"${confirm}>${text}</a>`;
        }
        return `<a href="${href}">${text}</a>`;
      },
    },
  });
  const html = marked.parse(resolveWikilinks(md)) as string;
  return { html, outline };
}
