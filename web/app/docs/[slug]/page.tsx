import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findGuide, guides, type DocBlock } from "@/lib/docs";
import { absoluteUrl, ORGANIZATION_ID } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return guides.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = findGuide(slug);
  if (!guide) notFound();
  return {
    title: guide.title,
    description: guide.description,
    alternates: {
      canonical: `/docs/${slug}`,
      types: { "text/markdown": `/docs/${slug}/index.md` }
    },
    openGraph: { title: guide.title, description: guide.description, url: `/docs/${slug}` }
  };
}

function Block({ block }: { block: DocBlock }) {
  switch (block.kind) {
    case "paragraph": return <p>{block.text}</p>;
    case "list": return <ul>{block.items.map((item) => <li key={item}>{item}</li>)}</ul>;
    case "code": return <pre tabIndex={0} aria-label={`${block.language} example`}><code>{block.text}</code></pre>;
    case "link": return <p><a href={block.href}>{block.label} →</a></p>;
  }
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = findGuide(slug);
  if (!guide) notFound();
  const nextGuide = guides[guides.indexOf(guide) + 1];
  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "TechArticle",
          "@id": absoluteUrl(`/docs/${slug}#article`),
          url: absoluteUrl(`/docs/${slug}`),
          headline: guide.title,
          description: guide.description,
          inLanguage: "en",
          publisher: { "@id": ORGANIZATION_ID },
          mainEntityOfPage: absoluteUrl(`/docs/${slug}`)
        }).replace(/</g, "\\u003c") }}
      />
      <p className="resource-kicker">Documentation</p>
      <h1>{guide.title}</h1>
      <p className="docs-lede">{guide.description}</p>
      <a className="docs-markdown" href={`/docs/${slug}/index.md`}>Read as Markdown</a>
      <nav className="docs-toc" aria-label="On this page">
        {guide.sections.map((section) => <a key={section.id} href={`#${section.id}`}>{section.title}</a>)}
      </nav>
      {guide.sections.map((section) => (
        <section className="docs-section" key={section.id} aria-labelledby={section.id}>
          <h2 id={section.id}>{section.title}</h2>
          {section.blocks.map((block, index) => <Block key={index} block={block} />)}
        </section>
      ))}
      <footer className="docs-footer">
        <a href="/docs">← All documentation</a>
        {nextGuide ? <a href={`/docs/${nextGuide.slug}`}>{nextGuide.title} →</a> : <a href="/support">Get support →</a>}
      </footer>
    </article>
  );
}
