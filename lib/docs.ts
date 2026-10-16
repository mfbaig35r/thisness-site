import { readFileSync, existsSync } from "node:fs";
import { join, posix } from "node:path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import rehypeRaw from "rehype-raw";
import rehypeShiki from "@shikijs/rehype";
import { visit } from "unist-util-visit";
import { toString } from "hast-util-to-string";
import type { Root, Element, Text } from "hast";

export type NavItem = { slug: string; title: string; icon: string; source: Source };
export type NavSection = { title: string; items: NavItem[] };
type Source = { kind: "guide"; file: string } | { kind: "upstream"; path: string };

const guide = (slug: string, title: string, icon: string, file = slug || "introduction"): NavItem => ({
  slug, title, icon, source: { kind: "guide", file },
});
const upstream = (slug: string, title: string, icon: string, path: string): NavItem => ({
  slug, title, icon, source: { kind: "upstream", path },
});

export const NAV: NavSection[] = [
  {
    title: "Get started",
    items: [
      guide("", "Introduction", "home"),
      guide("quickstart", "Quickstart", "player-play"),
      guide("concepts", "Core concepts", "fingerprint"),
    ],
  },
  {
    title: "Guides",
    items: [
      guide("domains", "Domains", "building"),
      guide("command-line", "Command line", "terminal-2"),
      guide("workbench", "The Workbench", "layout-sidebar"),
      guide("language-models", "Language models", "sparkles"),
      guide("supplier-lists", "Supplier lists", "list-check"),
      guide("evaluation", "Evaluation", "chart-dots"),
      guide("python-api", "Python API", "code"),
    ],
  },
  {
    title: "Design",
    items: [
      upstream("design/vision", "Vision", "eye", "docs/vision.md"),
      upstream("design/resolution-runs", "01 Resolution runs", "file-text", "docs/design/01-resolution-runs.md"),
      upstream("design/core-model", "02 Core model and storage", "file-text", "docs/design/02-core-model-and-storage.md"),
      upstream("design/resolution-pipeline", "03 Resolution pipeline", "file-text", "docs/design/03-resolution-pipeline.md"),
      upstream("design/review-workbench", "04 Review and Workbench", "file-text", "docs/design/04-m2-review-dossier-workbench-person.md"),
      upstream("design/llm-layer", "05 Language-model layer", "file-text", "docs/design/05-m3-llm-layer.md"),
      upstream("design/taxonomy", "06 Taxonomy", "file-text", "docs/design/06-m4-taxonomy.md"),
      upstream("design/real-organizations", "07 Real organizations", "file-text", "docs/design/07-m5-real-organizations.md"),
      upstream("design/supplier-lists", "08 Supplier lists", "file-text", "docs/design/08-supplier-lists.md"),
      upstream("design/real-people", "09 Real people", "file-text", "docs/design/09-real-people.md"),
    ],
  },
  {
    title: "Project",
    items: [upstream("changelog", "Changelog", "history", "CHANGELOG.md")],
  },
];

export const ALL = NAV.flatMap((s) => s.items.map((item) => ({ ...item, section: s.title })));

const REF: string = (() => {
  const p = join(process.cwd(), "content/upstream/ref.json");
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")).ref : "main";
})();
export const GITHUB = "https://github.com/mfbaig35r/thisness";
const SLUG_OF_PATH = new Map(
  ALL.filter((i) => i.source.kind === "upstream").map((i) => [(i.source as { path: string }).path, i.slug]),
);

export type Heading = { id: string; text: string; depth: number };
export type Doc = {
  slug: string;
  title: string;
  description?: string;
  section: string;
  html: string;
  headings: Heading[];
  sourceUrl: string;
};

function frontmatter(text: string): { data: Record<string, string>; body: string } {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return { data: {}, body: text };
  const data: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) data[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { data, body: text.slice(m[0].length) };
}

// Links between upstream documents become site links; other relative links point at the
// file on GitHub at the release the site documents.
function rewriteLinks(fromPath: string | null) {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "a") return;
      const href = String(node.properties?.href ?? "");
      if (!href || /^[a-z]+:/i.test(href) || href.startsWith("#") || href.startsWith("/")) {
        if (/^https?:/.test(href)) node.properties = { ...node.properties, target: "_blank", rel: ["noreferrer"] };
        return;
      }
      if (!fromPath) return;
      const [file, hash] = href.split("#");
      const target = posix.normalize(posix.join(posix.dirname(fromPath), file));
      const slug = SLUG_OF_PATH.get(target);
      node.properties = {
        ...node.properties,
        href: slug !== undefined ? `/docs/${slug}${hash ? `#${hash}` : ""}` : `${GITHUB}/blob/${REF}/${target}`,
      };
    });
  };
}

function collectHeadings(out: Heading[]) {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if ((node.tagName === "h2" || node.tagName === "h3") && node.properties?.id) {
        out.push({ id: String(node.properties.id), text: toString(node), depth: node.tagName === "h2" ? 2 : 3 });
      }
    });
  };
}

// "design 05" and "design 05 §4" in prose become links to that document.
const DESIGN_SLUGS: Record<string, string> = {
  "01": "design/resolution-runs", "02": "design/core-model", "03": "design/resolution-pipeline",
  "04": "design/review-workbench", "05": "design/llm-layer", "06": "design/taxonomy", "07": "design/real-organizations",
  "08": "design/supplier-lists", "09": "design/real-people",
};
function linkDesignMentions() {
  return (tree: Root) => {
    visit(tree, "text", (node: Text, index, parent) => {
      if (!parent || index === undefined) return;
      const tag = (parent as Element).tagName;
      if (tag === "a" || tag === "code" || tag === "pre" || /^h[1-6]$/.test(tag ?? "")) return;
      const re = /\b[Dd]esign (0[1-9])\b/g;
      if (!re.test(node.value)) return;
      re.lastIndex = 0;
      const parts: (Text | Element)[] = [];
      let last = 0;
      for (const m of node.value.matchAll(re)) {
        const at = m.index ?? 0;
        if (at > last) parts.push({ type: "text", value: node.value.slice(last, at) });
        parts.push({ type: "element", tagName: "a", properties: { href: `/docs/${DESIGN_SLUGS[m[1]]}` },
          children: [{ type: "text", value: m[0] }] });
        last = at + m[0].length;
      }
      if (last < node.value.length) parts.push({ type: "text", value: node.value.slice(last) });
      (parent as Element).children.splice(index, 1, ...parts);
      return index + parts.length;
    });
  };
}

// Code blocks drawn with box-drawing characters are diagrams: they get a font that has
// those characters at one width, and a line height at which vertical bars join.
const BOX_DRAWING = /[\u2500-\u257F\u25B2-\u25C4]/;
function markDiagrams() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "pre" || !BOX_DRAWING.test(toString(node))) return;
      // Shiki writes its classes as a "class" string, not hast's "className" list.
      const props = node.properties ?? {};
      if (typeof props.class === "string") props.class = `${props.class} diagram`;
      else {
        const list = Array.isArray(props.className) ? props.className.map(String) : [];
        props.className = [...list, "diagram"];
      }
      node.properties = props;
    });
  };
}

// Tables scroll on their own instead of widening the page.
function wrapTables() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName !== "table" || !parent || index === undefined) return;
      (parent as Element).children[index] = {
        type: "element", tagName: "div", properties: { className: ["table-wrap"] }, children: [node],
      };
    });
  };
}

async function render(markdown: string, fromPath: string | null) {
  const headings: Heading[] = [];
  const trusted = fromPath === null; // the site's own guides may carry HTML (diagrams)
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: trusted })
    .use(trusted ? rehypeRaw : () => undefined)
    .use(rehypeSlug)
    .use(linkDesignMentions)
    .use(rewriteLinks, fromPath)
    .use(collectHeadings, headings)
    .use(wrapTables)
    .use(rehypeShiki, {
      themes: { light: "github-light", dark: "github-dark-dimmed" },
      defaultColor: false,
      fallbackLanguage: "text",
    })
    .use(markDiagrams)
    .use(rehypeStringify)
    .process(markdown);
  return { html: String(file), headings };
}

export async function getDoc(slug: string): Promise<Doc | null> {
  const item = ALL.find((i) => i.slug === slug);
  if (!item) return null;
  if (item.source.kind === "guide") {
    const path = join(process.cwd(), "content/docs", `${item.source.file}.md`);
    const { data, body } = frontmatter(readFileSync(path, "utf8"));
    const { html, headings } = await render(body, null);
    return {
      slug, title: data.title ?? item.title, description: data.description, section: item.section,
      html, headings,
      sourceUrl: `https://github.com/mfbaig35r/thisness-site/blob/main/content/docs/${item.source.file}.md`,
    };
  }
  const path = join(process.cwd(), "content/upstream", item.source.path);
  let text = readFileSync(path, "utf8");
  const h1 = text.match(/^# (.+)\n/m);
  if (h1) text = text.replace(h1[0], "");
  const { html, headings } = await render(text, item.source.path);
  return {
    slug, title: h1 ? h1[1] : item.title, section: item.section, html, headings,
    sourceUrl: `${GITHUB}/blob/${REF}/${item.source.path}`,
  };
}

export function neighbors(slug: string) {
  const i = ALL.findIndex((item) => item.slug === slug);
  return { prev: i > 0 ? ALL[i - 1] : null, next: i >= 0 && i < ALL.length - 1 ? ALL[i + 1] : null };
}
