import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ALL, getDoc, neighbors } from "@/lib/docs";
import { Toc } from "@/components/docs/Toc";
import { Icon } from "@/components/Icon";

export const dynamicParams = false;

export function generateStaticParams() {
  return ALL.map((item) => ({ slug: item.slug ? item.slug.split("/") : [] }));
}

export async function generateMetadata({ params }: PageProps<"/docs/[[...slug]]">): Promise<Metadata> {
  const { slug } = await params;
  const doc = await getDoc((slug ?? []).join("/"));
  return doc ? { title: doc.title, description: doc.description } : {};
}

export default async function DocPage({ params }: PageProps<"/docs/[[...slug]]">) {
  const { slug } = await params;
  const key = (slug ?? []).join("/");
  const doc = await getDoc(key);
  if (!doc) notFound();
  const { prev, next } = neighbors(key);
  const href = (s: string) => (s ? `/docs/${s}` : "/docs");
  return (
    <main className="docs-card">
      <article className="doc" data-pagefind-body>
        <div className="doc-eyebrow" data-pagefind-ignore>{doc.section}</div>
        <h1 className="doc-title">{doc.title}</h1>
        {doc.description && <p className="doc-description">{doc.description}</p>}
        <div className="prose" dangerouslySetInnerHTML={{ __html: doc.html }} />
        <a className="edit-link" href={doc.sourceUrl} target="_blank" rel="noreferrer" data-pagefind-ignore>
          <Icon name="github" size={15} /> View the source of this page
        </a>
        <div className="doc-foot" data-pagefind-ignore>
          {prev ? (
            <Link className="pager" href={href(prev.slug)}><small>Previous</small>{prev.title}</Link>
          ) : <span style={{ flex: 1 }} />}
          {next ? (
            <Link className="pager next" href={href(next.slug)}><small>Next</small>{next.title}</Link>
          ) : <span style={{ flex: 1 }} />}
        </div>
      </article>
      <Toc headings={doc.headings} />
    </main>
  );
}
