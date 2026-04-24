import Link from "next/link";
import styles from "./zonePage.module.css";

type Props = { params: Promise<{ zoneKey: string }> };

export default async function ZonePage({ params }: Props) {
  const { zoneKey: raw } = await params;
  const zoneKey = decodeURIComponent(raw);
  console.log("[zone page] render", { zoneKey });
  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <p className={styles.kicker}>Zone</p>
        <h1 className={styles.title}>{zoneKey}</h1>
        <p className={styles.lede}>
          Carbon intensity and grid mix for this region will live here. Search
          again from the home page anytime.
        </p>
        <Link className={styles.back} href="/">
          ← Back to search
        </Link>
      </div>
    </main>
  );
}
