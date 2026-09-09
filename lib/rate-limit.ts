// In-memory login attempt tracking. This lives in module state, which
// persists for the life of the Node process — correct for a single-
// instance deployment (which is what this app runs as), but note it
// resets on server restart and would NOT be shared across multiple
// instances if this were ever deployed behind a load balancer. A
// database- or Redis-backed limiter would be needed for that case.

type Attempt = { count: number; firstAttemptAt: number };

const attempts = new Map<string, Attempt>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

function isExpired(entry: Attempt): boolean {
  return Date.now() - entry.firstAttemptAt > WINDOW_MS;
}

export function isRateLimited(key: string): boolean {
  const entry = attempts.get(key);
  if (!entry) return false;
  if (isExpired(entry)) {
    attempts.delete(key);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

export function recordFailedAttempt(key: string): void {
  const entry = attempts.get(key);
  if (!entry || isExpired(entry)) {
    attempts.set(key, { count: 1, firstAttemptAt: Date.now() });
  } else {
    entry.count += 1;
  }
}

export function clearAttempts(key: string): void {
  attempts.delete(key);
}
