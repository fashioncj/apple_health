import Image from "next/image";
import { guides } from "@/lib/docs";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="docs-page">
      <a className="docs-skip" href="#docs-content">Skip to documentation</a>
      <header className="site-header" aria-label="HealthSync">
        <a className="brand" href="/" aria-label="HealthSync home">
          <Image src="/healthsync-logo.png" alt="" width={42} height={42} priority />
          <span>HealthSync</span>
        </a>
        <nav aria-label="Page">
          <a href="/">Home</a>
          <a href="/docs">Docs</a>
          <a href="/support">Support</a>
        </nav>
      </header>
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
    </div>
  );
}
