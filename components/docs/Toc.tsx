"use client";

import { useEffect, useState } from "react";
import { Icon } from "../Icon";
import type { Heading } from "@/lib/docs";

export function Toc({ headings }: { headings: Heading[] }) {
  const [active, setActive] = useState<string | null>(headings[0]?.id ?? null);
  useEffect(() => {
    const onScroll = () => {
      let current = headings[0]?.id ?? null;
      for (const h of headings) {
        const el = document.getElementById(h.id);
        if (el && el.getBoundingClientRect().top < 120) current = h.id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [headings]);
  if (headings.length < 2) return <div />;
  return (
    <nav className="toc" data-pagefind-ignore aria-label="On this page">
      <div className="toc-title"><Icon name="align-left" size={15} /> On this page</div>
      <ul>
        {headings.map((h) => (
          <li key={h.id} className={`d${h.depth}`}>
            <a href={`#${h.id}`} className={active === h.id ? "active" : ""}>{h.text}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
