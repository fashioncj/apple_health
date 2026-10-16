const paths: Record<string, React.ReactNode> = {
  check: <path d="m6.8 12.4 3.2 3.2 7.2-7.2" />,
  steps: (
    <>
      <path d="M9.5 5.4a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      <path d="m8.8 7.4-2.1 4.2 3.6 1.8-1.7 5.2" />
      <path d="m11.2 8.2 2.2 2.4h3" />
      <path d="m12.4 14.2 3.2 4" />
    </>
  ),
  heart: (
    <path d="M20.4 7.8c0 4.8-8.4 9.6-8.4 9.6S3.6 12.6 3.6 7.8A4.1 4.1 0 0 1 10.8 5l1.2 1.3L13.2 5a4.1 4.1 0 0 1 7.2 2.8Z" />
  ),
  sleep: <path d="M18.4 15.5A7.6 7.6 0 0 1 8.5 5.6 7.9 7.9 0 1 0 18.4 15.5Z" />,
  lock: (
    <>
      <path d="M7.2 10.2V8a4.8 4.8 0 0 1 9.6 0v2.2" />
      <rect width="13.4" height="10.5" x="5.3" y="10.2" rx="2" />
      <path d="M12 14.2v2.3" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.4 19 6v5.2c0 4.3-2.8 7.7-7 9.4-4.2-1.7-7-5.1-7-9.4V6l7-2.6Z" />
      <path d="m8.7 12 2.1 2.1 4.5-4.7" />
    </>
  ),
  download: (
    <>
      <path d="M12 3.5v10.2" />
      <path d="m8.1 10.2 3.9 3.9 3.9-3.9" />
      <path d="M5.2 17.5v2.8h13.6v-2.8" />
    </>
  ),
  message: (
    <>
      <path d="M5 6.2h14v9.6H9.2L5 19.2v-13Z" />
      <path d="M8.4 9.8h7.2" />
      <path d="M8.4 12.4h4.6" />
    </>
  ),
  sync: (
    <>
      <path d="M19 8.5A7.5 7.5 0 0 0 5.6 7.2" />
      <path d="M5 4v3.6h3.6" />
      <path d="M5 15.5a7.5 7.5 0 0 0 13.4 1.3" />
      <path d="M19 20v-3.6h-3.6" />
    </>
  ),
  calendar: (
    <>
      <rect width="15" height="14" x="4.5" y="6" rx="2" />
      <path d="M4.5 10.5h15" />
      <path d="M8.5 3.8v3.6" />
      <path d="M15.5 3.8v3.6" />
    </>
  ),
  server: (
    <>
      <rect width="15" height="6" x="4.5" y="4.5" rx="1.6" />
      <rect width="15" height="6" x="4.5" y="13.5" rx="1.6" />
      <path d="M8 7.5h.01" />
      <path d="M8 16.5h.01" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3.8 13.7 9l5.3 1.8-5.3 1.8L12 18l-1.7-5.4L5 10.8 10.3 9 12 3.8Z" />
      <path d="M18.4 15.6v3.6" />
      <path d="M16.6 17.4h3.6" />
    </>
  ),
  code: (
    <>
      <path d="m9 7.5-4.5 4.5L9 16.5" />
      <path d="m15 7.5 4.5 4.5-4.5 4.5" />
    </>
  ),
  layers: (
    <>
      <path d="m12 4 8 4.2-8 4.2-8-4.2L12 4Z" />
      <path d="m4 12.2 8 4.2 8-4.2" />
      <path d="m4 16 8 4.2 8-4.2" />
    </>
  ),
  chart: (
    <>
      <path d="M4.5 19.5h15" />
      <path d="M7.5 16v-5" />
      <path d="M12 16V7" />
      <path d="M16.5 16v-3.5" />
    </>
  ),
  phone: (
    <>
      <rect width="10" height="17" x="7" y="3.5" rx="2.2" />
      <path d="M11 17.6h2" />
    </>
  ),
  book: (
    <>
      <path d="M5 5.5A2 2 0 0 1 7 3.5h12v14H7a2 2 0 0 0-2 2v-14Z" />
      <path d="M5 19.5a2 2 0 0 0 2 2h12v-4" />
    </>
  ),
  arrow: <path d="m9 18 6-6-6-6" />
};

export function Icon({ name }: { name: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      {paths[name] ?? paths.arrow}
    </svg>
  );
}
