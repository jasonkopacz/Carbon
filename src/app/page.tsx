import { ZoneSearch } from "@/components/ZoneSearch";
import { EnergyGrid } from "@/components/EnergyGrid";
import { RecentZones } from "@/components/RecentZones";
import styles from "./page.module.css";
import Link from "next/link";

const STATS = [
  { value: "500+", label: "Grid zones" },
  { value: "100+", label: "Countries" },
  { value: "Live", label: "Real-time data" },
  { value: "Free", label: "No account needed" },
];

const FEATURES = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
        <ellipse cx="12" cy="12" rx="4" ry="9" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 12h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: "Global coverage",
    body: "Search any Electricity Maps zone — countries, US states, Australian regions, balancing areas, and more.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Live carbon intensity",
    body: "Real-time grams of CO₂ per kilowatt-hour. See how clean the grid is right now for any region on Earth.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    title: "Energy mix breakdown",
    body: "Drill into solar, wind, nuclear, gas, coal, hydro — see exactly what sources are powering each region.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Token stays on server",
    body: "Your Electricity Maps API key never leaves the server. All data is fetched server-side with optional Redis caching.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="m4.93 4.93 2.12 2.12M16.95 16.95l2.12 2.12M19.07 4.93l-2.12 2.12M7.05 16.95l-2.12 2.12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: "Smart search",
    body: "Fuzzy match on zone keys, country names, display names, and region codes. Keyboard-navigable results.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    title: "Fast by default",
    body: "Results are cached in Redis. Repeat searches are instant. Built on Next.js App Router with server components.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Search a region",
    body: "Type a country, state, city, or grid code into the search bar. Results appear as you type.",
  },
  {
    step: "02",
    title: "View the zone's details",
    body: "Click any result to land on its zone page showing live carbon intensity and energy source breakdown.",
  },
  {
    step: "03",
    title: "See global carbon intensity",
    body: "View the global carbon intensity map to see how carbon intensity varies across the world.",
  },
];

const POPULAR_ZONES = [
  { key: "DE", name: "Germany" },
  { key: "FR", name: "France" },
  { key: "US-CAL-CISO", name: "California" },
  { key: "GB", name: "United Kingdom" },
  { key: "AU-NSW", name: "New South Wales" },
  { key: "JP-TK", name: "Tōkyō" },
  { key: "DK-DK1", name: "Denmark West" },
  { key: "US-TEX-ERCO", name: "Texas (ERCOT)" },
];

export default function Home() {
  return (
    <div className={styles.page}>
      <EnergyGrid />
      <header className={styles.header}>
        <span className={styles.brand}>
          <span className={styles.brandDot} />
          Carbon grid
        </span>
        <nav className={styles.nav}>
          <a className={styles.navLink} href="/api/health">
            API health
          </a>
          <a
            className={styles.navLink}
            href="https://static.electricitymaps.com/api/docs/index.html"
            target="_blank"
            rel="noreferrer"
          >
            Electricity Maps docs
          </a>
          <Link className={styles.navLink} href="/map">
            Global map
          </Link>
          <Link className={styles.navLink} href="/settings">
            Settings
          </Link>
        </nav>
      </header>

      <main className={styles.main}>
        {/* ── Hero ── */}
        <section className={styles.hero}>
          <div className={styles.heroGlow} aria-hidden />
          <p className={styles.kicker}>
            <span className={styles.kickerDot} />
            Live grid data
          </p>
          <h1 className={styles.title}>Carbon intensity by region</h1>
          <p className={styles.lede}>
            Search any Electricity Maps zone — countries, states, balancing
            areas — to open its detail page. Data comes from the Electricity
            Maps API; your token stays on the server.
          </p>
          <ZoneSearch />
          <RecentZones />
        </section>

        {/* ── Stats ── */}
        <section className={styles.statsBar}>
          {STATS.map((s) => (
            <div key={s.label} className={styles.stat}>
              <span className={styles.statValue}>{s.value}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </section>

        {/* ── Features grid ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Everything you need to track grid carbon</h2>
          <div className={styles.featureGrid}>
            {FEATURES.map((f) => (
              <div key={f.title} className={styles.featureCard}>
                <div className={styles.featureIcon}>{f.icon}</div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureBody}>{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>How it works</h2>
          <div className={styles.steps}>
            {HOW_IT_WORKS.map((s) => (
              <div key={s.step} className={styles.step}>
                <span className={styles.stepNum}>{s.step}</span>
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepBody}>{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Popular zones ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Popular zones</h2>
          <div className={styles.zoneGrid}>
            {POPULAR_ZONES.map((z) => (
              <Link
                key={z.key}
                href={`/z/${encodeURIComponent(z.key)}`}
                className={styles.zoneCard}
              >
                <span className={styles.zoneCode}>{z.key}</span>
                <span className={styles.zoneName}>{z.name}</span>
                <span className={styles.zoneArrow}>→</span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <span>Built with Next.js · Prisma · Redis</span>
        <span className={styles.footerDivider}>·</span>
        <span>Data from Electricity Maps</span>
      </footer>
    </div>
  );
}
