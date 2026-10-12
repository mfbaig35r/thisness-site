"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";

type Hit = { url: string; title: string; excerpt: string };
type Pagefind = {
  search: (q: string) => Promise<{ results: { data: () => Promise<{ url: string; meta: { title?: string }; excerpt: string }> }[] }>;
};

// Pagefind indexes the built site (npm run build); in development the index does not exist.
async function loadPagefind(): Promise<Pagefind | null> {
  try {
    const path = "/pagefind/pagefind.js";
    return (await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ path)) as Pagefind;
  } catch {
    return null;
  }
}

export function Search() {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const engine = useRef<Pagefind | null | undefined>(undefined);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [selected, setSelected] = useState(0);
  const [unavailable, setUnavailable] = useState(false);
  const router = useRouter();

  const open = () => {
    dialog.current?.showModal();
    setTimeout(() => input.current?.focus(), 0);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        open();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!query.trim()) return setHits([]);
      if (engine.current === undefined) engine.current = await loadPagefind();
      if (!engine.current) return setUnavailable(true);
      const found = await engine.current.search(query);
      const data = await Promise.all(found.results.slice(0, 8).map((r) => r.data()));
      if (!cancelled) {
        setHits(data.map((d) => ({ url: d.url.replace(/\.html$/, "").replace(/\/index$/, "") || "/", title: d.meta.title ?? d.url, excerpt: d.excerpt })));
        setSelected(0);
      }
    })();
    return () => { cancelled = true; };
  }, [query]);

  const go = (url: string) => {
    dialog.current?.close();
    router.push(url);
  };

  return (
    <>
      <button className="search-button" type="button" onClick={open} aria-label="Search">
        <Icon name="search" size={15} /> <span className="label">Search</span> <kbd>⌘K</kbd>
      </button>
      <dialog className="cmdk" ref={dialog} onClick={(e) => e.target === dialog.current && dialog.current?.close()}>
        <div className="cmdk-input">
          <Icon name="search" size={18} className="muted" />
          <input
            ref={input} type="search" placeholder="Search the docs" value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, hits.length - 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
              if (e.key === "Enter" && hits[selected]) go(hits[selected].url);
            }}
          />
          <kbd>esc</kbd>
        </div>
        <div className="cmdk-results">
          {unavailable && <div className="cmdk-empty">Search is built with the site (npm run build).</div>}
          {!unavailable && query && hits.length === 0 && <div className="cmdk-empty">Nothing found.</div>}
          {!query && <div className="cmdk-empty">Guides, design documents and the changelog.</div>}
          {hits.map((h, i) => (
            <a key={h.url} href={h.url} className={`cmdk-result${i === selected ? " selected" : ""}`}
               onClick={(e) => { e.preventDefault(); go(h.url); }} onMouseEnter={() => setSelected(i)}>
              <b>{h.title}</b>
              <p dangerouslySetInnerHTML={{ __html: h.excerpt }} />
            </a>
          ))}
        </div>
      </dialog>
    </>
  );
}
