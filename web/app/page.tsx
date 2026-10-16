import Image from "next/image";
import { Icon } from "@/components/Icon";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { absoluteUrl, APP_STORE_URL, GITHUB_URL, ORGANIZATION_ID } from "@/lib/site";

const previewRows = [
  { title: "Steps", detail: "8,412 today", icon: "steps", tone: "green" },
  { title: "Heart rate", detail: "62 bpm resting", icon: "heart", tone: "red" },
  { title: "Sleep", detail: "7h 24m", icon: "sleep", tone: "violet" }
];

const stats = [
  { value: "180+", label: "Apple Health data types" },
  { value: "11", label: "Health categories" },
  { value: "0", label: "Analytics or third-party SDKs" },
  { value: "Free", label: "On the App Store" }
];

const flowSteps = [
  {
    icon: "heart",
    title: "Apple Health",
    body: "You grant read-only HealthKit access for the exact data types you want."
  },
  {
    icon: "phone",
    title: "HealthSync on iPhone",
    body: "New and deleted samples are normalized to JSON and queued safely in local storage."
  },
  {
    icon: "server",
    title: "Your API",
    body: "Batches upload over HTTPS to your backend or a private hosted workspace."
  },
  {
    icon: "chart",
    title: "Your tools",
    body: "Dashboards, data warehouses, and AI agents read from a source you control."
  }
];

const features = [
  {
    icon: "sync",
    title: "Automatic background sync",
    body: "HealthKit change delivery, hourly or daily scheduled catch-up, and a sync when you open the app."
  },
  {
    icon: "calendar",
    title: "Backfill any date range",
    body: "Pull historical Apple Health data for any range, or re-sync the last 24 hours with one tap."
  },
  {
    icon: "layers",
    title: "Retry-safe upload queue",
    body: "Failed uploads stay queued on the device. Deterministic record IDs make retries duplicate-free."
  },
  {
    icon: "check",
    title: "Edits and deletions sync too",
    body: "When a sample is deleted in Apple Health, HealthSync sends the deletion so your copy stays accurate."
  },
  {
    icon: "server",
    title: "Self-host or go hosted",
    body: "Start instantly with a private hosted workspace, or point the app at your own FastAPI and Postgres stack."
  },
  {
    icon: "sparkle",
    title: "Built for AI agents",
    body: "Hosted workspaces include a read-only agent endpoint with daily summaries designed for LLM tools."
  }
];

const dataCategories = [
  { name: "Activity", examples: "Steps, distance, active energy, exercise minutes" },
  { name: "Heart", examples: "Heart rate, resting HR, HRV, VO2 max, blood pressure" },
  { name: "Sleep & Mindfulness", examples: "Sleep stages, mindful minutes" },
  { name: "Body", examples: "Weight, body fat, BMI, lean mass, wrist temperature" },
  { name: "Workouts", examples: "Type, duration, energy, distance, heart rate, effort" },
  { name: "Nutrition", examples: "Calories, macros, water, vitamins, minerals" },
  { name: "Respiratory", examples: "Respiratory rate, blood oxygen, lung function" },
  { name: "Mobility", examples: "Walking steadiness, gait, stair speed" },
  { name: "Hearing & Environment", examples: "Audio exposure, daylight, UV" },
  { name: "Clinical", examples: "Blood glucose, insulin, alcohol" },
  { name: "Reproductive Health", examples: "Cycle tracking and related records" },
  { name: "Symptoms & Events", examples: "Symptoms, hygiene, and other events" }
];

const useCases = [
  {
    icon: "chart",
    title: "Personal dashboards",
    body: "Feed Grafana, Metabase, or a custom app with live Apple Health data stored in your own Postgres."
  },
  {
    icon: "sparkle",
    title: "AI health assistants",
    body: "Give an agent a scoped, read-only token to your health history instead of uploading export files."
  },
  {
    icon: "layers",
    title: "Quantified-self archives",
    body: "Keep a durable, queryable copy of years of health data without manual Apple Health exports."
  },
  {
    icon: "code",
    title: "Developer prototypes",
    body: "Build on real HealthKit data without writing and shipping your own iOS sync layer."
  }
];

const privacyPoints = [
  {
    title: "Read-only HealthKit access",
    body: "HealthSync never writes to Apple Health and only reads the types you enable."
  },
  {
    title: "No analytics in the app",
    body: "No tracking, telemetry, ad SDKs, or third-party health SDKs. Nothing phones home."
  },
  {
    title: "Tokens live in the Keychain",
    body: "Backend and agent tokens are stored in the iOS Keychain and never written to logs."
  },
  {
    title: "Open source",
    body: "The app and backend are Apache-2.0 licensed, so you can audit exactly what is sent."
  }
];

const nextSteps = [
  {
    title: "Download HealthSync",
    body: "Install the free app from the App Store on your iPhone."
  },
  {
    title: "Pick a destination",
    body: "Tap Continue for a private hosted workspace, or enter your own backend URL and token."
  },
  {
    title: "Choose data and sync",
    body: "Enable the Apple Health types you want, then sync the last 24 hours or backfill history."
  }
];

const faqItems = [
  {
    question: "Where can I download HealthSync?",
    answer: "HealthSync is available from the App Store for iPhone."
  },
  {
    question: "Is HealthSync free?",
    answer: "Yes. HealthSync is free to download from the App Store, and the source code is open under Apache-2.0."
  },
  {
    question: "Will this website read my Apple Health data?",
    answer:
      "No. Apple Health permissions are handled inside the iOS app, and this website never reads or stores your Apple Health data."
  },
  {
    question: "Can I choose what HealthSync syncs?",
    answer:
      "Yes. HealthSync lets you choose the health data types and sync timing from inside the iOS app."
  },
  {
    question: "Do I need my own server?",
    answer:
      "No. By default HealthSync creates a private hosted workspace for you. You can switch to your own backend at any time in Settings."
  },
  {
    question: "How often does HealthSync sync in the background?",
    answer:
      "You can choose hourly, daily, or manual. iOS decides exactly when background work runs, so scheduled syncs are best-effort; manual sync and backfill always run immediately."
  }
];

const samplePayload = `POST /api/apple-health/sync
Authorization: Bearer ••••••••

{
  "schema_version": 2,
  "device_id": "3F2A…",
  "export_id": "b1c4…",
  "timezone": "Europe/Berlin",
  "metrics": [
    {
      "id": "healthkit:9E1D…",
      "type": "step_count",
      "value": 1243,
      "unit": "count",
      "start_at": "2026-10-16T08:00:00Z",
      "end_at": "2026-10-16T09:00:00Z"
    }
  ],
  "workouts": [ … ],
  "deletions": [ … ]
}`;

const homeStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": absoluteUrl("/#software-application"),
      name: "HealthSync",
      applicationCategory: "HealthApplication",
      applicationSubCategory: "Health data synchronization",
      operatingSystem: "iOS",
      url: absoluteUrl("/"),
      description:
        "Privacy-first iOS app for syncing selected Apple Health data from HealthKit to a private backend API.",
      image: absoluteUrl("/healthsync-logo.png"),
      author: {
        "@id": ORGANIZATION_ID
      },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        url: APP_STORE_URL
      },
      featureList: [
        "Apple Health app sync through HealthKit",
        "Private REST backend uploads",
        "Selected HealthKit data type toggles",
        "Automatic HealthKit change delivery and scheduled catch-up",
        "Queued retry for failed sync batches",
        "Backfill of historical Apple Health data",
        "Read-only AI agent endpoint for hosted workspaces",
        "No website access to Apple Health data"
      ],
      sameAs: [APP_STORE_URL, GITHUB_URL]
    },
    {
      "@type": "FAQPage",
      "@id": absoluteUrl("/#faq"),
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer
        }
      }))
    }
  ]
};

function AppStoreButton({ variant = "dark" }: { variant?: "dark" | "light" }) {
  return (
    <a className={`lp-store-button ${variant}`} href={APP_STORE_URL}>
      <svg aria-hidden="true" viewBox="0 0 24 24" className="lp-apple">
        <path d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8 0 0-2.5-1-2.5-3.9ZM14 5.4c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.1-.6 2.8-1.4Z" />
      </svg>
      <span>
        <small>Download on the</small>
        App Store
      </span>
    </a>
  );
}

function PhonePreview() {
  return (
    <div className="lp-phone-stage" aria-hidden="true">
      <div className="phone">
        <div className="phone-screen">
          <div className="phone-status">
            <span>9:41</span>
            <div>
              <span />
              <span />
              <span />
            </div>
          </div>
          <div className="phone-app-header">
            <Image src="/healthsync-logo.png" alt="" width={66} height={66} priority />
            <div>
              <strong>HealthSync</strong>
              <span>Sync your health data. On your terms.</span>
            </div>
          </div>
          <div className="lp-phone-status">
            <span className="lp-pulse" />
            <div>
              <strong>Synced 2 minutes ago</strong>
              <span>Hourly · 1,284 records today</span>
            </div>
          </div>
          <div className="preview-list">
            {previewRows.map((row) => (
              <div className={`preview-row ${row.tone}`} key={row.title}>
                <div className="row-icon">
                  <Icon name={row.icon} />
                </div>
                <div>
                  <strong>{row.title}</strong>
                  <span>{row.detail}</span>
                </div>
                <div className="row-state">On</div>
              </div>
            ))}
          </div>
          <div className="phone-privacy">
            <Icon name="lock" />
            <span>Your data stays private. You are in control.</span>
          </div>
        </div>
      </div>

      <div className="lp-float lp-float-top">
        <span className="lp-float-badge">200 OK</span>
        <div>
          <strong>POST /api/apple-health/sync</strong>
          <span>142 metrics · 1 workout</span>
        </div>
      </div>
      <div className="lp-float lp-float-bottom">
        <div className="lp-float-icon">
          <Icon name="shield" />
        </div>
        <div>
          <strong>Read-only HealthKit</strong>
          <span>Only the types you choose</span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="lp">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeStructuredData) }}
      />
      <SiteHeader />

      <section className="lp-hero" id="top" aria-labelledby="hero-title">
        <div className="lp-shell lp-hero-grid">
          <div className="lp-hero-copy">
            <a className="lp-eyebrow" href={GITHUB_URL}>
              <span>Free</span>
              iPhone app · Open source under Apache-2.0
            </a>
            <h1 id="hero-title">
              Your Apple Health data, <em>synced to your own API.</em>
            </h1>
            <p className="lp-lede">
              HealthSync reads the HealthKit data you choose on your iPhone and keeps it in sync
              with a private backend, so your dashboards, databases, and AI agents always have
              fresh health data, without handing it to a third-party cloud.
            </p>
            <div className="lp-hero-actions">
              <AppStoreButton />
              <a className="lp-button-ghost" href="/support">
                Read the docs
                <Icon name="arrow" />
              </a>
            </div>
            <ul className="lp-trust" aria-label="Highlights">
              <li>
                <Icon name="check" /> No analytics
              </li>
              <li>
                <Icon name="check" /> Read-only access
              </li>
              <li>
                <Icon name="check" /> Self-host or hosted
              </li>
            </ul>
          </div>

          <PhonePreview />
        </div>
      </section>

      <section className="lp-stats" aria-label="HealthSync at a glance">
        <div className="lp-shell lp-stats-grid">
          {stats.map((stat) => (
            <div key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-section" id="how-it-works" aria-labelledby="how-title">
        <div className="lp-shell">
          <div className="lp-heading center">
            <p className="lp-kicker">How it works</p>
            <h2 id="how-title">From your wrist to your database, automatically.</h2>
            <p>
              Apple does not offer a cloud API for Health data. HealthSync is the missing bridge:
              it runs on your iPhone, where the data lives, and delivers it to an endpoint you own.
            </p>
          </div>
          <ol className="lp-flow">
            {flowSteps.map((step, index) => (
              <li key={step.title}>
                <div className="lp-flow-icon">
                  <Icon name={step.icon} />
                </div>
                <span className="lp-flow-index">Step {index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="lp-section muted" id="features" aria-labelledby="features-title">
        <div className="lp-shell">
          <div className="lp-heading">
            <p className="lp-kicker">Features</p>
            <h2 id="features-title">Set it up once. It keeps your data current.</h2>
            <p>
              HealthSync handles HealthKit permissions, background delivery, retries, and
              deletions so you can focus on what you build with the data.
            </p>
          </div>
          <div className="lp-feature-grid">
            {features.map((feature) => (
              <article className="lp-card" key={feature.title}>
                <div className="lp-card-icon">
                  <Icon name={feature.icon} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section" id="data-types" aria-labelledby="data-title">
        <div className="lp-shell lp-split">
          <div className="lp-heading">
            <p className="lp-kicker">What syncs</p>
            <h2 id="data-title">180+ Apple Health types. You pick which ones.</h2>
            <p>
              Toggle categories or individual types in the app. HealthSync only requests read
              permission for what you enable, and you can change it any time.
            </p>
            <a className="lp-text-link" href="/support#data-types">
              See how data is exported
              <Icon name="arrow" />
            </a>
          </div>
          <ul className="lp-chip-grid">
            {dataCategories.map((category) => (
              <li key={category.name}>
                <strong>{category.name}</strong>
                <span>{category.examples}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="lp-section muted" aria-labelledby="usecases-title">
        <div className="lp-shell">
          <div className="lp-heading center">
            <p className="lp-kicker">Use cases</p>
            <h2 id="usecases-title">Made for people who want their data working for them.</h2>
          </div>
          <div className="lp-usecase-grid">
            {useCases.map((item) => (
              <article className="lp-card" key={item.title}>
                <div className="lp-card-icon">
                  <Icon name={item.icon} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section lp-dev" id="developers" aria-labelledby="dev-title">
        <div className="lp-shell lp-split">
          <div className="lp-heading">
            <p className="lp-kicker">For developers</p>
            <h2 id="dev-title">A simple, documented JSON contract.</h2>
            <p>
              Every batch is a single authenticated POST with metrics, workouts, and deletions.
              Record IDs are stable, so your backend can upsert safely on every retry.
            </p>
            <ul className="lp-checklist">
              <li>
                <Icon name="check" /> Bearer-token auth with per-device headers
              </li>
              <li>
                <Icon name="check" /> Deterministic <code>healthkit:&#123;uuid&#125;</code> IDs
              </li>
              <li>
                <Icon name="check" /> Open-source FastAPI + Postgres backend
              </li>
              <li>
                <Icon name="check" /> Read-only agent endpoint with daily summaries
              </li>
            </ul>
            <div className="lp-inline-actions">
              <a className="lp-button-light" href="/support#api">
                API reference
              </a>
              <a className="lp-text-link light" href={GITHUB_URL}>
                View on GitHub
                <Icon name="arrow" />
              </a>
            </div>
          </div>
          <div className="lp-code" aria-label="Example sync request">
            <div className="lp-code-bar">
              <span />
              <span />
              <span />
              <em>sync-request.json</em>
            </div>
            <pre>
              <code>{samplePayload}</code>
            </pre>
          </div>
        </div>
      </section>

      <section className="lp-section" id="privacy" aria-labelledby="privacy-title">
        <div className="lp-shell lp-split">
          <div className="lp-heading">
            <p className="lp-kicker">Privacy</p>
            <h2 id="privacy-title">Private by design, not by promise.</h2>
            <p>
              Your Apple Health data stays on your iPhone until you choose to sync it, and then it
              goes only where you point it. This website never reads or accesses it.
            </p>
            <a className="lp-text-link" href="/privacy">
              Read the privacy policy
              <Icon name="arrow" />
            </a>
          </div>
          <div className="lp-privacy-grid">
            {privacyPoints.map((point) => (
              <article key={point.title}>
                <div className="lp-privacy-icon">
                  <Icon name="shield" />
                </div>
                <h3>{point.title}</h3>
                <p>{point.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section muted" aria-labelledby="start-title">
        <div className="lp-shell">
          <div className="lp-heading center">
            <p className="lp-kicker">Get started</p>
            <h2 id="start-title">Syncing in under a minute.</h2>
          </div>
          <ol className="lp-steps">
            {nextSteps.map((step, index) => (
              <li key={step.title}>
                <span className="lp-step-number">{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="lp-section" id="faq" aria-labelledby="faq-title">
        <div className="lp-shell lp-split">
          <div className="lp-heading">
            <p className="lp-kicker">FAQ</p>
            <h2 id="faq-title">Frequently asked questions</h2>
            <p>
              Can&apos;t find an answer? Visit{" "}
              <a className="lp-inline-link" href="/support">
                Docs &amp; Support
              </a>{" "}
              or email us.
            </p>
          </div>
          <div className="faq-list">
            {faqItems.map((item) => (
              <details key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-final" aria-labelledby="final-title">
        <div className="lp-shell lp-final-inner">
          <Image src="/healthsync-logo.png" alt="" width={72} height={72} />
          <h2 id="final-title">Own your Apple Health data.</h2>
          <p>Free on the App Store. Set up in less than a minute.</p>
          <div className="lp-hero-actions center">
            <AppStoreButton variant="light" />
            <a className="lp-button-ghost light" href="/support">
              Docs &amp; Support
              <Icon name="arrow" />
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
