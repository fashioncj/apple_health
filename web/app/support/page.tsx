import type { Metadata } from "next";
import { Icon } from "@/components/Icon";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { absoluteUrl, APP_STORE_URL, CONTACT_EMAIL, GITHUB_URL } from "@/lib/site";

const pageTitle = "Docs & Support";
const pageDescription =
  "HealthSync documentation and support: setup, hosted and self-hosted storage, data types, background sync, the sync API, AI agent access, troubleshooting, and contact details.";

const toc = [
  { id: "getting-started", label: "Getting started" },
  { id: "storage", label: "Storage modes" },
  { id: "self-hosting", label: "Self-hosting the backend" },
  { id: "data-types", label: "Data types & export format" },
  { id: "background", label: "Background sync" },
  { id: "api", label: "Sync API reference" },
  { id: "agents", label: "AI agent access" },
  { id: "troubleshooting", label: "Troubleshooting" },
  { id: "contact", label: "Contact support" }
];

const quickLinks = [
  {
    href: "/docs",
    icon: "book",
    title: "Setup guides",
    body: "Step-by-step server and agent guides."
  },
  {
    href: "#api",
    icon: "code",
    title: "API reference",
    body: "Endpoints, headers, and the JSON payload."
  },
  {
    href: "#troubleshooting",
    icon: "message",
    title: "Get help",
    body: "Common fixes and how to contact us."
  }
];

const quickStartItems = [
  {
    title: "Install HealthSync",
    body: "Download HealthSync for free from the App Store on an iPhone running iOS 17 or later."
  },
  {
    title: "Tap Continue",
    body: "HealthSync creates a private hosted workspace for you, then asks you to review Apple Health read permissions."
  },
  {
    title: "Grant read access",
    body: "Allow the Apple Health categories you want to sync. HealthSync cannot read anything you do not grant."
  },
  {
    title: "Run your first sync",
    body: "Tap Sync last 24 hours, or open Backfill date range to import older history."
  },
  {
    title: "Fine-tune in Settings",
    body: "Switch to your own backend, choose data types, and set the sync frequency to hourly, daily, or manual."
  }
];

const storageModes = [
  {
    title: "Hosted workspace",
    badge: "Default",
    points: [
      "No server to run: created automatically when you tap Continue.",
      "Each workspace is isolated with its own ingest token.",
      "Includes a private, read-only agent endpoint and token.",
      "Refresh the agent token or reset storage from Settings."
    ]
  },
  {
    title: "Your own backend",
    badge: "Self-hosted",
    points: [
      "Enter any HTTPS backend URL and bearer token in Settings.",
      "Use the open-source FastAPI + Postgres backend, or your own.",
      "Data never touches HealthSync infrastructure.",
      "Ideal for Grafana, data warehouses, and custom apps."
    ]
  }
];

const troubleshootingItems = [
  {
    title: "Apple Health permissions are not ready",
    body:
      "Open the Apple Health permission prompt again from HealthSync (Settings → Apple Health Access), or review permissions in iPhone Settings → Health. HealthSync cannot read categories you have not granted."
  },
  {
    title: "Backend connection fails",
    body:
      "Confirm the URL is reachable from the iPhone, uses HTTPS in production, and matches the token saved in HealthSync. For same-Wi-Fi local testing, allow iOS Local Network access if prompted."
  },
  {
    title: "No samples are found",
    body:
      "Check that the selected data types contain Apple Health samples in the chosen date range. Simulators are useful for UI testing but do not represent real Apple Health data availability."
  },
  {
    title: "Uploads keep retrying",
    body:
      "Failed uploads stay queued locally for the next HealthKit update, scheduled catch-up, app activation, or manual sync. Open Sync Logs and confirm the backend is healthy."
  },
  {
    title: "Background sync seems late",
    body:
      "iOS decides when background work runs. Low Power Mode, a recent reboot, or force-quitting the app can delay it. Opening the app triggers a catch-up sync, and manual sync always runs immediately."
  },
  {
    title: "Hosted storage or agent credentials need refresh",
    body:
      "Use the hosted storage controls in Settings to refresh the read-only agent token or reset hosted storage when the saved token is no longer valid."
  },
  {
    title: "Workout details are missing",
    body:
      "Selecting Workouts also requests heart-rate, energy, distance, and effort access. Re-request these from Settings → Apple Health Access. Fields the source app did not record are omitted rather than set to zero."
  }
];

const selfHostCode = `git clone ${GITHUB_URL}.git
cd healthykit
cp .env.example .env
python3 -m backend.scripts.generate_token   # paste as API_TOKEN
python3 -m backend.scripts.generate_token   # paste as TOKEN_HASH_SECRET
docker compose up --build`;

const headersCode = `POST {backend_url}/api/apple-health/sync
Authorization: Bearer {token}
Content-Type: application/json
X-Device-Id: {stable_local_device_id}
X-App-Version: {app_version}`;

const payloadCode = `{
  "device_id": "device-1",
  "export_id": "11111111-1111-4111-8111-111111111111",
  "generated_at": "2026-05-31T10:00:00.000Z",
  "timezone": "Asia/Kolkata",
  "source": "ios-healthkit",
  "schema_version": 2,
  "date_range": {
    "start": "2026-05-30T10:00:00.000Z",
    "end": "2026-05-31T10:00:00.000Z"
  },
  "metrics": [
    {
      "id": "healthkit:{sample_uuid}",
      "type": "step_count",
      "value": 1243,
      "unit": "count",
      "start_at": "…", "end_at": "…",
      "source_name": "iPhone",
      "metadata": {}
    }
  ],
  "workouts": [],
  "deletions": [
    { "id": "healthkit:{sample_uuid}", "kind": "metric" }
  ]
}`;

const agentCode = `curl -H "Authorization: Bearer $AGENT_TOKEN" \\
  "https://api.example.com/api/agent/health-data"`;

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: "/support"
  },
  openGraph: {
    title: `${pageTitle} | HealthSync`,
    description: pageDescription,
    url: "/support",
    siteName: "HealthSync",
    type: "website",
    images: [
      {
        url: absoluteUrl("/healthsync-logo.png"),
        width: 1024,
        height: 1024,
        alt: "HealthSync app icon"
      }
    ]
  }
};

const supportStructuredData = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "HealthSync Docs & Support",
  description: pageDescription,
  url: absoluteUrl("/support"),
  mainEntity: {
    "@type": "Organization",
    name: "HealthSync",
    url: absoluteUrl("/"),
    email: CONTACT_EMAIL,
    contactPoint: {
      "@type": "ContactPoint",
      email: CONTACT_EMAIL,
      contactType: "customer support",
      availableLanguage: "en"
    }
  }
};

function CodeBlock({ title, code }: { title: string; code: string }) {
  return (
    <div className="kb-code">
      <div className="kb-code-title">{title}</div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function SupportPage() {
  return (
    <main className="lp kb-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(supportStructuredData) }}
      />
      <SiteHeader />

      <section className="kb-hero" aria-labelledby="kb-title">
        <div className="lp-shell">
          <p className="lp-kicker">Docs &amp; Support</p>
          <h1 id="kb-title">Everything you need to sync Apple Health.</h1>
          <p className="lp-lede">
            Guides for setting up HealthSync, running your own backend, understanding the data
            format, and fixing common issues. Still stuck? Email us anytime.
          </p>
          <div className="kb-quick">
            {quickLinks.map((link) => (
              <a className="kb-quick-card" href={link.href} key={link.title}>
                <div className="lp-card-icon">
                  <Icon name={link.icon} />
                </div>
                <div>
                  <strong>{link.title}</strong>
                  <span>{link.body}</span>
                </div>
                <Icon name="arrow" />
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="lp-shell kb-layout">
        <aside className="kb-toc" aria-label="On this page">
          <p>On this page</p>
          <ul>
            {toc.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`}>{item.label}</a>
              </li>
            ))}
          </ul>
          <a className="kb-toc-help" href={`mailto:${CONTACT_EMAIL}`}>
            <Icon name="message" />
            Email support
          </a>
        </aside>

        <article className="kb-content">
          <section id="getting-started" aria-labelledby="gs-title">
            <h2 id="gs-title">Getting started</h2>
            <p>
              HealthSync works out of the box with a private hosted workspace, so you can be
              syncing in under a minute. You only need an iPhone with Apple Health.
            </p>
            <ol className="kb-steps">
              {quickStartItems.map((item) => (
                <li key={item.title}>
                  <strong>{item.title}</strong>
                  <span>{item.body}</span>
                </li>
              ))}
            </ol>
            <div className="kb-callout">
              <Icon name="shield" />
              <p>
                HealthSync requests <strong>read-only</strong> HealthKit access. It never writes to
                Apple Health, and this website never sees your health data.
              </p>
            </div>
            <a className="lp-store-inline" href={APP_STORE_URL}>
              Download HealthSync on the App Store
              <Icon name="arrow" />
            </a>
          </section>

          <section id="storage" aria-labelledby="storage-title">
            <h2 id="storage-title">Storage modes</h2>
            <p>
              Choose where your data goes. You can switch between modes at any time in Settings.
            </p>
            <div className="kb-mode-grid">
              {storageModes.map((mode) => (
                <div className="kb-mode" key={mode.title}>
                  <div className="kb-mode-head">
                    <h3>{mode.title}</h3>
                    <span>{mode.badge}</span>
                  </div>
                  <ul>
                    {mode.points.map((point) => (
                      <li key={point}>
                        <Icon name="check" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section id="self-hosting" aria-labelledby="self-title">
            <h2 id="self-title">Self-hosting the backend</h2>
            <p>
              The repository includes a FastAPI backend that stores uploads in Postgres. The fastest
              way to run it locally is Docker Compose:
            </p>
            <CodeBlock title="Terminal" code={selfHostCode} />
            <p>Then, in HealthSync Settings, switch to your own backend and enter:</p>
            <ul className="kb-list">
              <li>
                <strong>Simulator:</strong> <code>http://127.0.0.1:8080</code>
              </li>
              <li>
                <strong>iPhone on the same Wi-Fi:</strong> <code>http://&lt;mac-lan-ip&gt;:8080</code>
              </li>
              <li>
                <strong>Production:</strong> an HTTPS endpoint you control
              </li>
              <li>
                <strong>Auth token:</strong> the same value as <code>API_TOKEN</code>
              </li>
            </ul>
            <p>
              For Supabase, Neon, or any managed Postgres, set <code>DATABASE_URL</code>, run{" "}
              <code>alembic upgrade head</code>, and deploy <code>uvicorn backend.main:app</code>.
              For HTTPS, backups, and upgrades, follow the{" "}
              <a href="/docs/self-hosting">server setup</a> and{" "}
              <a href="/docs/operations">server operations</a> guides.
            </p>
          </section>

          <section id="data-types" aria-labelledby="data-title">
            <h2 id="data-title">Data types &amp; export format</h2>
            <p>
              HealthSync supports 180+ Apple Health types across 11 categories: Activity, Heart,
              Body, Sleep &amp; Mindfulness, Nutrition, Respiratory, Mobility, Hearing &amp;
              Environment, Clinical, Reproductive Health, and Symptoms &amp; Events, plus
              Workouts.
            </p>
            <ul className="kb-list">
              <li>
                Every metric and workout gets a stable ID, <code>healthkit:&#123;sample_uuid&#125;</code>,
                so re-sending a record never creates a duplicate.
              </li>
              <li>
                Deleted Apple Health samples are sent as <code>deletions</code>, scoped to your
                workspace and device.
              </li>
              <li>
                Workouts include activity type, duration, active and total energy, distance,
                average and max heart rate, METs, and effort scores when the source records them.
              </li>
              <li>
                Missing values are omitted, never filled with zero. Metadata values are always
                strings.
              </li>
            </ul>
          </section>

          <section id="background" aria-labelledby="bg-title">
            <h2 id="bg-title">Background sync</h2>
            <p>HealthSync combines three wake-up paths to keep data current:</p>
            <div className="kb-mini-grid">
              <div>
                <Icon name="heart" />
                <strong>HealthKit delivery</strong>
                <span>Wakes the app when Apple Health saves or deletes selected samples.</span>
              </div>
              <div>
                <Icon name="calendar" />
                <strong>Scheduled refresh</strong>
                <span>Hourly or daily best-effort background refresh, set in Settings.</span>
              </div>
              <div>
                <Icon name="sync" />
                <strong>Catch-up on open</strong>
                <span>Every time you open the app, queued and recent changes are synced.</span>
              </div>
            </div>
            <p>
              iOS controls when background work actually runs, so timing is not exact. Manual sync
              and backfill are always the reliable paths. Successful batches are pruned from the
              device after 7 days; failed ones stay queued until they upload.
            </p>
          </section>

          <section id="api" aria-labelledby="api-title">
            <h2 id="api-title">Sync API reference</h2>
            <p>
              To build your own backend, accept this request. Respond with a 2xx status once the
              batch is stored; anything else keeps the batch queued for retry.
            </p>
            <CodeBlock title="Request" code={headersCode} />
            <CodeBlock title="Body (schema_version 2)" code={payloadCode} />
            <p>
              The reference backend responds with counts for <code>received</code>,{" "}
              <code>duplicates</code>, and <code>deleted</code>. It also exposes authenticated
              read endpoints:
            </p>
            <div className="kb-table" role="table" aria-label="Read endpoints">
              <div role="row" className="kb-table-head">
                <span role="columnheader">Endpoint</span>
                <span role="columnheader">Returns</span>
              </div>
              <div role="row">
                <code role="cell">GET /api/apple-health/syncs</code>
                <span role="cell">Uploaded sync batches</span>
              </div>
              <div role="row">
                <code role="cell">GET /api/apple-health/metrics</code>
                <span role="cell">Metrics, filterable by device and type</span>
              </div>
              <div role="row">
                <code role="cell">GET /api/apple-health/workouts</code>
                <span role="cell">Workouts, filterable by device</span>
              </div>
              <div role="row">
                <code role="cell">GET /health</code>
                <span role="cell">Backend health check</span>
              </div>
            </div>
          </section>

          <section id="agents" aria-labelledby="agents-title">
            <h2 id="agents-title">AI agent access</h2>
            <p>
              Hosted workspaces include a separate <strong>read-only</strong> agent endpoint and
              token. Give these to an AI tool instead of your ingest token or database credentials.
            </p>
            <CodeBlock title="Agent request" code={agentCode} />
            <p>
              Responses include raw records plus agent-friendly fields: a catalog of metric types,
              activity types, devices, and timezones; local dates on every record; daily metric and
              workout summaries; and pagination. See the{" "}
              <a href="/docs/agent-access">agent access guide</a> for setup steps.
            </p>
            <div className="kb-callout warn">
              <Icon name="lock" />
              <p>
                Never share your ingest token with an agent. If a token may have been exposed,
                refresh it from Settings before continuing.
              </p>
            </div>
          </section>

          <section id="troubleshooting" aria-labelledby="ts-title">
            <h2 id="ts-title">Troubleshooting</h2>
            <div className="faq-list kb-faq">
              {troubleshootingItems.map((item) => (
                <details key={item.title}>
                  <summary>{item.title}</summary>
                  <p>{item.body}</p>
                </details>
              ))}
            </div>
          </section>

          <section id="contact" aria-labelledby="contact-title">
            <div className="kb-contact">
              <div>
                <h2 id="contact-title">Still need help?</h2>
                <p>
                  Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with your iPhone
                  model, iOS version, app version, storage mode, and the Sync Log message you see.
                </p>
                <p className="kb-contact-note">
                  Please don&apos;t send raw Apple Health exports or any tokens. HealthSync is a data
                  sync utility, not a medical device, and does not provide medical advice or
                  emergency support.
                </p>
              </div>
              <div className="kb-contact-actions">
                <a className="lp-button-light" href={`mailto:${CONTACT_EMAIL}`}>
                  Email support
                </a>
                <a className="lp-text-link light" href={`${GITHUB_URL}/issues`}>
                  Open a GitHub issue
                  <Icon name="arrow" />
                </a>
              </div>
            </div>
          </section>
        </article>
      </div>

      <SiteFooter />
    </main>
  );
}
