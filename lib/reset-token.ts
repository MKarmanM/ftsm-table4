const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

type ResetPayload = { userId: string; purpose: "password_reset"; exp: number };

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET belum ditetapkan dalam .env.");
  }
  return secret;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
  const padded = str
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(str.length + ((4 - (str.length % 4)) % 4), "=");
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return base64UrlEncode(new Uint8Array(sig));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

export async function signResetToken(userId: string): Promise<string> {
  const payload: ResetPayload = {
    userId,
    purpose: "password_reset",
    exp: Date.now() + RESET_TOKEN_TTL_MS,
  };
  const payloadStr = base64UrlEncode(
    new TextEncoder().encode(JSON.stringify(payload))
  );
  const sig = await hmac(payloadStr);
  return `${payloadStr}.${sig}`;
}

export async function verifyResetToken(token: string): Promise<string | null> {
  const [payloadStr, sig] = token.split(".");
  if (!payloadStr || !sig) return null;

  const expectedSig = await hmac(payloadStr);
  if (!timingSafeEqual(expectedSig, sig)) return null;

  try {
    const payload: ResetPayload = JSON.parse(
      new TextDecoder().decode(base64UrlDecode(payloadStr))
    );
    if (payload.purpose !== "password_reset") return null;
    if (payload.exp < Date.now()) return null;
    return payload.userId;
  } catch {
    return null;
  }
}
