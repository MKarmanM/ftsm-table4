import assert from "node:assert/strict";
import test from "node:test";
import { normalizeDatabaseUrl } from "../lib/database-url";

test("upgrades legacy sslmode=require to verify-full and preserves Neon parameters", () => {
  const normalized = normalizeDatabaseUrl(
    "postgresql://user:pass@example.neon.tech/db?sslmode=require&channel_binding=require"
  );
  const url = new URL(normalized);

  assert.equal(url.searchParams.get("sslmode"), "verify-full");
  assert.equal(url.searchParams.get("channel_binding"), "require");
});

test("leaves an explicit verify-full mode unchanged", () => {
  const normalized = normalizeDatabaseUrl(
    "postgresql://user:pass@example.com/db?sslmode=verify-full"
  );
  assert.equal(new URL(normalized).searchParams.get("sslmode"), "verify-full");
});

test("leaves local URLs without sslmode unchanged", () => {
  const raw = "postgresql://postgres:postgres@localhost:5432/test";
  assert.equal(normalizeDatabaseUrl(raw), raw);
});

test("rejects a missing DATABASE_URL", () => {
  assert.throws(() => normalizeDatabaseUrl(undefined), /DATABASE_URL is not configured/);
});
