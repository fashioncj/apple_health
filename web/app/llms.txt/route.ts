export const dynamic = "force-static";

import { absoluteUrl, APP_STORE_URL } from "@/lib/site";
import { guides } from "@/lib/docs";

const content = `# HealthSync

> HealthSync is an iPhone app that syncs selected Apple Health data from HealthKit to hosted HealthSync storage or a backend the user controls.

HealthSync is a data sync utility, not a medical device. It does not provide medical advice, diagnosis, or treatment.

Canonical website: ${absoluteUrl("/")}

## Setup and agent documentation

- [Documentation index](${absoluteUrl("/docs/index.md")}): Choose a setup guide. Human-readable documentation starts at ${absoluteUrl("/docs")}.
${guides.map((guide) => `- [${guide.title}](${absoluteUrl(`/docs/${guide.slug}/index.md`)}): ${guide.description}`).join("\n")}

## Primary pages

- [Apple Health app sync guide](${absoluteUrl("/apple-health-app-sync")}): How HealthSync reads selected HealthKit data on-device and uploads queued JSON batches to a private API.
- [Apple Health sync alternatives](${absoluteUrl("/apple-health-sync-alternatives")}): A sourced comparison of private-API, webhook, and export options.
- [Privacy policy](${absoluteUrl("/privacy")}): What HealthSync may process and how users control Health permissions.
- [Support](${absoluteUrl("/support")}): Setup and troubleshooting guidance for HealthKit permissions and backend sync.
- [App Store listing](${APP_STORE_URL}): Download HealthSync for iPhone.
- [Source repository](https://github.com/megabyte0x/healthykit): Open source code and implementation context.

## Facts

- Apple Health permissions are requested only inside the iOS app.
- Users choose which supported HealthKit data types to sync.
- The website does not read or store Apple Health data.
- The configured backend URL and token determine where selected data is sent.
- Standard self-hosted API_TOKEN credentials permit uploads and reads; they are not read-only agent credentials.
- Hosted agents use the complete private agent endpoint and a separate read-only agent token. Preserve any URL path prefix.
- Never request database credentials or ingest tokens for a read-only agent integration.

Last reviewed: 2026-10-22
`;

export function GET() {
  return new Response(content, {
    headers: {
      "Cache-Control": "public, max-age=0, must-revalidate",
      "Content-Type": "text/plain; charset=utf-8"
    }
  });
}
