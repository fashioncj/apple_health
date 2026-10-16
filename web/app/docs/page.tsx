import type { Metadata } from "next";
import { guides } from "@/lib/docs";

export const metadata: Metadata = {
  title: "Documentation",
  description: "Set up HealthSync, run your own server, and connect an agent to your private Apple Health data.",
  alternates: { canonical: "/docs", types: { "text/markdown": "/docs/index.md" } },
  openGraph: {
    title: "HealthSync documentation",
    description: "Setup, self-hosting, server operations, and private agent access.",
    url: "/docs"
  }
};

export default function DocsPage() {
  return (
    <>
      <p className="resource-kicker">Documentation</p>
      <h1>Set up your sync.</h1>
      <p className="docs-lede">
        Connect Apple Health, choose where your data lives, and give your tools access.
        Start with hosted storage or run the server yourself.
      </p>
      <div className="docs-guides">
        {guides.map((guide, index) => (
          <a className="docs-guide-link" key={guide.slug} href={`/docs/${guide.slug}`}>
            <span className="resource-kicker">0{index + 1}</span>
            <div><h2>{guide.title}</h2><p>{guide.description}</p></div>
            <span aria-hidden="true">→</span>
          </a>
        ))}
      </div>
      <section className="docs-section" aria-labelledby="agents-title">
        <h2 id="agents-title">Using an AI assistant?</h2>
        <p>
          Each guide has a Markdown version with the same instructions. Give your assistant
          the <a href="/llms.txt">documentation index</a> to find the right guide.
          Credentials belong in your tool&apos;s private settings.
        </p>
        <a href="/docs/index.md">Read this index as Markdown</a>
      </section>
    </>
  );
}
