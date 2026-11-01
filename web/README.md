# HealthSync website

The public HealthSync website is a Next.js static export hosted on Cloudflare Pages.
The iPhone app and private health-data backend are separate from this public site.

Public URLs:

- Website: https://healthysync.app
- App Store: https://apps.apple.com/in/app/healthysync/id6776575569
- Privacy policy: https://healthysync.app/privacy
- Support: https://healthysync.app/support
- Documentation: https://healthysync.app/docs
- Agent documentation index: https://healthysync.app/llms.txt

Documentation content lives in `lib/docs.ts`. HTML guides under `/docs/<slug>` and
Markdown versions under `/docs/<slug>/index.md` share the same source. Adding a guide
there includes it in navigation, the sitemap, and `llms.txt`.

## Run locally

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

## Cloudflare Pages deployment

The `healthysync` Pages project connects to `megabyte0x/healthykit` on GitHub and
builds changes to `web/` on `main` automatically. Its root directory is `web`, build
command is `npm run build`, and output directory is `out`. The canonical public URL
is `https://healthysync.app`; `NEXT_PUBLIC_SITE_URL` can override it for local checks.

For a manual production deployment after authenticating with `npx wrangler login`:

```bash
npm ci
npm run build
npm run deploy
```

`wrangler.jsonc` records the Pages project configuration. `public/_headers` supplies
security headers, allows the Cloudflare analytics beacon, and advertises `llms.txt`.
`functions/_middleware.js` sends `www` and the production Pages hostname to the apex
domain while preserving the path and query string.
The Pages Function in `functions/api/health.js` serves the live health check; the
Next.js route provides the same response shape during local development.

Cloudflare Web Analytics is enabled for the `healthysync.app` zone with automatic
script injection. Do not add a second beacon to the app layout. Website analytics
measures visits and performance and does not access Apple Health data. View reports
in the Cloudflare dashboard under Web Analytics → healthysync.app.

The former `healthysync.megabyte.sh` hostname redirects permanently to the new domain.
GitHub Pages documentation entry points also point readers to the canonical site.

## Verification

```bash
npm run typecheck
npm run build
SITE_URL=https://healthysync.app npm run health
```
