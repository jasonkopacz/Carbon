"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("[error boundary]", error);
    }
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        background: "#0b0f14",
        color: "#e2e8f0",
        fontFamily: "system-ui, sans-serif",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600, margin: 0 }}>
        Something went wrong
      </h1>
      <p style={{ color: "#8a9bb0", maxWidth: "28rem", margin: 0 }}>
        An unexpected error occurred. You can try again or return to the home
        page.
      </p>
      {error.digest && (
        <code
          style={{
            fontSize: "0.75rem",
            color: "#4b5563",
            background: "#111827",
            padding: "0.25rem 0.5rem",
            borderRadius: "0.25rem",
          }}
        >
          {error.digest}
        </code>
      )}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={reset}
          style={{
            padding: "0.5rem 1.25rem",
            background: "#3ddc97",
            color: "#0b0f14",
            border: "none",
            borderRadius: "0.375rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        <Link
          href="/"
          style={{
            padding: "0.5rem 1.25rem",
            background: "#1e293b",
            color: "#e2e8f0",
            border: "none",
            borderRadius: "0.375rem",
            fontWeight: 600,
            cursor: "pointer",
            textDecoration: "none",
          }}
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
