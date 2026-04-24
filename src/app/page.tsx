import { ZoneSearch } from "@/components/ZoneSearch";
import styles from "./page.module.css";

export default function Home() {
  console.log("[page] Home render");
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.brand}>Carbon grid</span>
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
        </nav>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <p className={styles.kicker}>Live grid data</p>
          <h1 className={styles.title}>Carbon intensity by region</h1>
          <p className={styles.lede}>
            Search any Electricity Maps zone — countries, states, balancing
            areas — to open its detail page. Data comes from the Electricity Maps
            API; your token stays on the server.
          </p>
          <ZoneSearch />
        </section>
      </main>

      <footer className={styles.footer}>
        <span>Built with Next.js · Prisma · Redis</span>
      </footer>
    </div>
  );
}
