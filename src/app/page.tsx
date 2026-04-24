import styles from "./page.module.css";

export default function Home() {
  console.log("[page] Home render");
  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <p className={styles.kicker}>Electricity Maps</p>
        <h1 className={styles.title}>Grid carbon intensity</h1>
        <p className={styles.lede}>
          Next.js app with Postgres, Redis, and Docker wired for the Electricity
          Maps API. Use{" "}
          <code className={styles.code}>/api/health</code> to verify services.
        </p>
        <div className={styles.actions}>
          <a
            className={styles.primary}
            href="https://static.electricitymaps.com/api/docs/index.html"
            target="_blank"
            rel="noreferrer"
          >
            API docs
          </a>
          <a className={styles.secondary} href="/api/health">
            Health check
          </a>
        </div>
      </div>
    </main>
  );
}
