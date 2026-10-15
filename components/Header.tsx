"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";
import { Search } from "./Search";

const LINKS = [
  { href: "/docs", label: "Docs", always: true, match: (p: string) => p.startsWith("/docs") && !p.startsWith("/docs/design") },
  { href: "/explorer", label: "Explorer", always: true, match: (p: string) => p.startsWith("/explorer") },
  { href: "/docs/design/vision", label: "Design", match: (p: string) => p.startsWith("/docs/design") },
  { href: "/docs/changelog", label: "Changelog", match: (p: string) => p === "/docs/changelog" },
];

export function Header({ overWhite = false }: { overWhite?: boolean }) {
  const pathname = usePathname() ?? "/";
  return (
    <header className={`site-header${overWhite ? " over-white" : ""}`}>
      <Link href="/" className="brand" aria-label="Thisness home">
        <span className="mark">T</span> Thisness <span className="version">v0.2.0</span>
      </Link>
      <nav className="nav-links">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={`${l.match(pathname) ? "active" : ""}${"always" in l ? "" : " wide-only"}`}>{l.label}</Link>
        ))}
      </nav>
      <div className="header-right">
        <Search />
        <a className="icon-link" href="https://github.com/mfbaig35r/thisness" aria-label="GitHub" target="_blank" rel="noreferrer">
          <Icon name="github" size={19} />
        </a>
        <a className="icon-link" href="https://pypi.org/project/thisness/" aria-label="PyPI" target="_blank" rel="noreferrer">
          <Icon name="package" size={19} />
        </a>
      </div>
    </header>
  );
}
