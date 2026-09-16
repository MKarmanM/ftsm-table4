import { signHmacPayload, verifyHmacPayload } from "./hmac-token";

export const SESSION_COOKIE_NAME = "table4_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type SessionPayload = { userId: string; exp: number };

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET belum ditetapkan. Tambah dalam .env — contoh nilai: " +
        "run `openssl rand -hex 32` (atau mana-mana rentetan rawak panjang) " +
        "dan letak sebagai SESSION_SECRET=..."
    );
  }
  return secret;
}

export async function signSession(userId: string): Promise<string> {
  const payload: SessionPayload = {
    userId,
    exp: Date.now() + SESSION_TTL_SECONDS * 1000,
  };
  return signHmacPayload(payload, getSecret());
}

export async function verifySessionToken(
  token: string | undefined
): Promise<SessionPayload | null> {
  const payload = await verifyHmacPayload<SessionPayload>(token, getSecret());
  if (!payload || typeof payload.userId !== "string") return null;
  if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
  return payload;
}
