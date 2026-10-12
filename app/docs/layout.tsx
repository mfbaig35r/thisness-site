import { Header } from "@/components/Header";
import { Sidebar } from "@/components/docs/Sidebar";
import { NAV } from "@/lib/docs";

export default function DocsLayout({ children }: LayoutProps<"/docs">) {
  const sections = NAV.map((s) => ({ title: s.title, items: s.items.map(({ slug, title, icon }) => ({ slug, title, icon })) }));
  return (
    <>
      <Header />
      <div className="docs-shell">
        <Sidebar sections={sections} />
        {children}
      </div>
    </>
  );
}
