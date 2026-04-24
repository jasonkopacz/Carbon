"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./ZoneSearch.module.css";

type ZoneRow = {
  zoneKey: string;
  zoneName: string;
  countryName: string | null;
  displayName: string | null;
};

function primaryLabel(z: ZoneRow): string {
  if (z.displayName && z.displayName !== z.zoneName) {
    return z.displayName;
  }
  return z.zoneName;
}

export function ZoneSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ZoneRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      setError(null);
      setOpen(false);
      return;
    }
    setLoading(true);
    setError(null);
    const ac = new AbortController();
    const tid = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/zones/search?q=${encodeURIComponent(q)}`,
          { signal: ac.signal },
        );
        const body = (await res.json()) as {
          zones?: ZoneRow[];
          error?: string;
        };
        if (!res.ok) {
          throw new Error(body.error ?? "Search failed");
        }
        console.log("[ZoneSearch] results", {
          count: body.zones?.length ?? 0,
        });
        setResults(body.zones ?? []);
        setOpen(true);
        setActive(-1);
      } catch (e) {
        if ((e as Error).name === "AbortError") {
          return;
        }
        setError((e as Error).message);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => {
      window.clearTimeout(tid);
      ac.abort();
    };
  }, [query]);

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const pick = useCallback(
    (z: ZoneRow) => {
      console.log("[ZoneSearch] pick", { zoneKey: z.zoneKey });
      setQuery(primaryLabel(z));
      setOpen(false);
      router.push(`/z/${encodeURIComponent(z.zoneKey)}`);
    },
    [router],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) {
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      pick(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <label className={styles.label} htmlFor="zone-search">
        Find a grid region
      </label>
      <div className={styles.inputRow}>
        <span className={styles.searchIcon} aria-hidden>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm0-2a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11Z"
              fill="currentColor"
            />
            <path
              d="m16.5 16.5 4 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <input
          id="zone-search"
          className={styles.input}
          type="search"
          autoComplete="off"
          placeholder="e.g. Germany, Texas, Tokyo…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={open}
          aria-controls="zone-search-listbox"
          aria-autocomplete="list"
        />
        {loading ? <span className={styles.spinner} aria-label="Loading" /> : null}
      </div>
      <p className={styles.hint}>Type at least two characters. Results match zone name, country, or code.</p>
      {error ? <p className={styles.error}>{error}</p> : null}
      {open && query.trim().length >= 2 && !loading ? (
        <div
          id="zone-search-listbox"
          className={styles.dropdown}
          role="listbox"
          aria-label="Grid zones"
        >
          {results.length === 0 ? (
            <div className={styles.empty}>No regions match that search.</div>
          ) : (
            results.map((z, i) => (
              <button
                key={z.zoneKey}
                type="button"
                role="option"
                aria-selected={i === active}
                data-active={i === active}
                className={styles.item}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(z)}
              >
                <div className={styles.itemTitle}>{primaryLabel(z)}</div>
                <div className={styles.itemMeta}>
                  <span className={styles.code}>{z.zoneKey}</span>
                  {z.countryName ? <span>{z.countryName}</span> : null}
                  {z.displayName &&
                  z.displayName !== z.zoneName &&
                  z.displayName !== primaryLabel(z) ? (
                    <span>{z.zoneName}</span>
                  ) : null}
                </div>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
