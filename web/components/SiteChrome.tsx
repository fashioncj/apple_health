import Image from "next/image";
import { APP_STORE_URL, CONTACT_EMAIL, GITHUB_URL } from "@/lib/site";

const navLinks = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#developers", label: "Developers" },
  { href: "/docs", label: "Docs" },
  { href: "/support", label: "Support" }
];

export function SiteHeader() {
  return (
    <header className="hs-header" aria-label="HealthSync">
      <a className="brand" href="/" aria-label="HealthSync home">
        <Image src="/healthsync-logo.png" alt="" width={40} height={40} priority />
        <span>HealthSync</span>
      </a>
      <nav className="hs-nav" aria-label="Primary">
        {navLinks.map((link) => (
          <a key={link.href} href={link.href}>
            {link.label}
          </a>
        ))}
        <a className="hs-nav-cta" href={APP_STORE_URL}>
          Get the app
        </a>
      </nav>
    </header>
  );
}

const footerColumns = [
  {
    title: "Product",
    links: [
      { href: "/#features", label: "Features" },
      { href: "/#how-it-works", label: "How it works" },
      { href: "/#data-types", label: "What syncs" },
      { href: APP_STORE_URL, label: "App Store" }
    ]
  },
  {
    title: "Resources",
    links: [
      { href: "/docs", label: "Documentation" },
      { href: "/support", label: "Support" },
      { href: "/apple-health-app-sync", label: "Apple Health sync guide" },
      { href: "/apple-health-sync-alternatives", label: "Alternatives" },
      { href: GITHUB_URL, label: "Source on GitHub" }
    ]
  },
  {
    title: "Company",
    links: [
      { href: "/privacy", label: "Privacy policy" },
      { href: `mailto:${CONTACT_EMAIL}`, label: "Contact" }
    ]
  }
];

export function SiteFooter() {
  return (
    <footer className="hs-footer">
      <div className="hs-footer-inner">
        <div className="hs-footer-brand">
          <a className="brand" href="/" aria-label="HealthSync home">
            <Image src="/healthsync-logo.png" alt="" width={36} height={36} />
            <span>HealthSync</span>
          </a>
          <p>
            Sync selected Apple Health data from your iPhone to an API you control. No analytics,
            no third-party SDKs, read-only HealthKit access.
          </p>
        </div>
        {footerColumns.map((column) => (
          <div className="hs-footer-col" key={column.title}>
            <h2>{column.title}</h2>
            <ul>
              {column.links.map((link) => (
                <li key={link.label}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="hs-footer-base">
        <span>© 2026 megabyte0x. Licensed under Apache-2.0.</span>
        <span>HealthSync is a data sync utility, not a medical device.</span>
      </div>
    </footer>
  );
}
