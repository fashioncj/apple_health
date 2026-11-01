export const dynamic = "force-static";

import { findGuide, guideMarkdown, guides } from "@/lib/docs";
import { absoluteUrl } from "@/lib/site";

export function generateStaticParams() {
  return guides.map(({ slug }) => ({ slug }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = findGuide(slug);
  if (!guide) return new Response("Guide not found", { status: 404 });
  return new Response(guideMarkdown(guide), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
      Link: `<${absoluteUrl("/llms.txt")}>; rel="describedby"`
    }
  });
}
