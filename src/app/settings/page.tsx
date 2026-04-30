import Link from "next/link";
import { cookies } from "next/headers";
import { EnergyGrid } from "@/components/EnergyGrid";
import { saveToken } from "./actions";
import styles from "./settings.module.css";

export default async function SettingsPage() {
  const jar = await cookies();
  const hasToken = !!jar.get("em_token")?.value;
  const envToken = !!process.env.ELECTRICITY_MAPS_API_TOKEN;

  return (
    <div className={styles.page}>
      <EnergyGrid />

      <header className={styles.header}>
        <Link href="/" className={styles.back}>← Back</Link>
        <span className={styles.headerTitle}>Settings</span>
      </header>

      <main className={styles.main}>
        <h1 className={styles.title}>API token</h1>
        <p className={styles.lede}>
          Carbon grid uses the{" "}
          <a href="https://static.electricitymaps.com/api/docs/index.html" target="_blank" rel="noreferrer" className={styles.link}>
            Electricity Maps API
          </a>{" "}
          to fetch live grid data. Your token is stored in an{" "}
          <code>httpOnly</code> cookie and is never exposed to the browser.
        </p>

        {/* Status */}
        <div className={styles.statusRow}>
          <div className={`${styles.statusCard} ${(hasToken || envToken) ? styles.ok : styles.warn}`}>
            <span className={styles.statusDot} />
            <div>
              <p className={styles.statusTitle}>
                {hasToken
                  ? "Custom token active (cookie)"
                  : envToken
                    ? "Using server environment token"
                    : "No token configured"}
              </p>
              <p className={styles.statusBody}>
                {hasToken
                  ? "Requests use the token you saved below. Clear it to fall back to the server environment variable."
                  : envToken
                    ? "ELECTRICITY_MAPS_API_TOKEN is set on the server. You can override it per-session below."
                    : "Set a token to fetch live data. Get a free key at electricitymaps.com."}
              </p>
            </div>
          </div>
        </div>

        {/* Token form */}
        <form action={saveToken} className={styles.form}>
          <label htmlFor="token" className={styles.label}>
            Electricity Maps API token
          </label>
          <div className={styles.inputRow}>
            <input
              id="token"
              name="token"
              type="password"
              autoComplete="off"
              placeholder={hasToken ? "••••••••••••  (token saved)" : "Paste your token here"}
              className={styles.input}
            />
          </div>
          <p className={styles.hint}>
            Leave blank and save to remove the cookie token and revert to the server environment variable.
          </p>
          <div className={styles.btnRow}>
            <button type="submit" className={styles.saveBtn}>
              Save token
            </button>
            {hasToken && (
              <button type="submit" name="token" value="" className={styles.clearBtn}>
                Clear token
              </button>
            )}
          </div>
        </form>

        {/* Where to get a token */}
        <div className={styles.helpCard}>
          <h2 className={styles.helpTitle}>Getting a token</h2>
          <ol className={styles.helpList}>
            <li>Visit <a href="https://app.electricitymaps.com/developer-hub/playground" target="_blank" rel="noreferrer" className={styles.link}>app.electricitymaps.com/developer-hub</a></li>
            <li>Sign in or create a free account</li>
            <li>Copy your API token from the dashboard</li>
            <li>Paste it above and click Save token</li>
          </ol>
        </div>
      </main>
    </div>
  );
}
