const LEGACY_SSL_MODES = new Set(["prefer", "require", "verify-ca"]);

/**
 * Returns a PostgreSQL connection URL with explicit certificate and hostname
 * verification when a provider supplies one of node-postgres' legacy SSL
 * modes. Other query parameters (for example Neon channel_binding) are kept.
 */
export function normalizeDatabaseUrl(rawUrl: string | undefined): string {
  if (!rawUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const url = new URL(rawUrl);
  const sslMode = url.searchParams.get("sslmode")?.toLowerCase();

  if (sslMode && LEGACY_SSL_MODES.has(sslMode)) {
    url.searchParams.set("sslmode", "verify-full");
  }

  return url.toString();
}
