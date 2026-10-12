"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "../Icon";

export type SideSection = { title: string; items: { slug: string; title: string; icon: string }[] };

export function Sidebar({ sections }: { sections: SideSection[] }) {
  const pathname = (usePathname() ?? "/docs").replace(/\/$/, "");
  const current = sections.flatMap((s) => s.items).find((i) => (i.slug ? `/docs/${i.slug}` : "/docs") === pathname);
  const list = sections.map((s) => (
    <div className="side-section" key={s.title}>
      <div className="side-title">{s.title}</div>
      {s.items.map((item) => {
        const href = item.slug ? `/docs/${item.slug}` : "/docs";
        return (
          <Link key={href} href={href} className={`side-item${pathname === href ? " active" : ""}`}>
            <Icon name={item.icon} size={16} /> <span>{item.title}</span>
          </Link>
        );
      })}
    </div>
  ));
  return (
    <>
      <details className="mobile-nav" data-pagefind-ignore key={pathname}>
        <summary><Icon name="menu" size={16} /> {current?.title ?? "Docs"}</summary>
        <div className="mobile-nav-list">{list}</div>
      </details>
      <aside className="docs-sidebar" data-pagefind-ignore>{list}</aside>
    </>
  );
}

