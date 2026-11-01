export const dynamic = "force-static";

import { guides } from "@/lib/docs";
import { absoluteUrl } from "@/lib/site";

export function GET() {
  const links = guides.map((guide) =>
    `- [${guide.title}](${absoluteUrl(`/docs/${guide.slug}/index.md`)}): ${guide.description}`
  ).join("\n");
  return new Response(`# HealthSync documentation\n\nSet up Apple Health sync with hosted storage or your own server.\n\n${links}\n`, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
      Link: `<${absoluteUrl("/llms.txt")}>; rel="describedby"`
    }
  });
}
