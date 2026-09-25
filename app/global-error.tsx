"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the full error only in the browser console for technical diagnosis.
    console.error(error);
  }, [error]);

  return (
    <html lang="ms">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#f8fafc",
          color: "#172033",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            boxSizing: "border-box",
          }}
        >
          <section
            role="alert"
            style={{
              width: "100%",
              maxWidth: "512px",
              padding: "32px",
              border: "1px solid #d9e1ea",
              borderRadius: "16px",
              background: "#ffffff",
              boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
              textAlign: "center",
            }}
          >
            <p style={{ margin: 0, color: "#b42318", fontWeight: 700 }}>
              Ralat sistem
            </p>
            <h1 style={{ margin: "10px 0 0", fontSize: "26px" }}>
              Sistem tidak dapat dimuatkan
            </h1>
            <p style={{ margin: "14px 0 0", color: "#52606d", lineHeight: 1.6 }}>
              Perkhidmatan mungkin terganggu buat sementara waktu. Sila cuba
              semula.
            </p>
            <p style={{ margin: "16px 0 0", color: "#6b7280", fontSize: "13px" }}>
              Kod rujukan: {error.digest ?? "Tidak tersedia"}
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                marginTop: "24px",
                minHeight: "40px",
                padding: "9px 18px",
                border: 0,
                borderRadius: "10px",
                background: "#0f5d8f",
                color: "#ffffff",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              Cuba semula
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
