import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { guides } from "@/lib/docs";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="docs-page">
      <a className="docs-skip" href="#docs-content">Skip to documentation</a>
      <SiteHeader />
      <div className="docs-shell">
        <aside className="docs-sidebar">
          <nav aria-label="Documentation">
            <a href="/docs">Documentation overview</a>
            {guides.map((guide) => (
              <a key={guide.slug} href={`/docs/${guide.slug}`}>{guide.title}</a>
            ))}
          </nav>
          <a className="resource-text-link" href="/llms.txt">Documentation for agents</a>
        </aside>
        <main className="docs-content" id="docs-content" tabIndex={-1}>{children}</main>
      </div>
      <SiteFooter />
    </div>
  );
}
