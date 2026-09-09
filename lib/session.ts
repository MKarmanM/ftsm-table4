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
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data)
  );
  return base64UrlEncode(new Uint8Array(sig));
}

// Constant-time string comparison so signature checks don't leak timing
// information an attacker could use to guess a valid signature byte by byte.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function signSession(userId: string): Promise<string> {
  const payload: SessionPayload = {
    userId,
    exp: Date.now() + SESSION_TTL_SECONDS * 1000,
  };
  const payloadStr = base64UrlEncode(
    new TextEncoder().encode(JSON.stringify(payload))
  );
  const sig = await hmac(payloadStr);
  return `${payloadStr}.${sig}`;
}

export async function verifySessionToken(
  token: string | undefined
): Promise<SessionPayload | null> {
  if (!token) return null;
  const [payloadStr, sig] = token.split(".");
  if (!payloadStr || !sig) return null;

  const expectedSig = await hmac(payloadStr);
  if (!timingSafeEqual(expectedSig, sig)) return null; // tampered

  try {
    const payload: SessionPayload = JSON.parse(
      new TextDecoder().decode(base64UrlDecode(payloadStr))
    );
    if (payload.exp < Date.now()) return null; // expired
    return payload;
  } catch {
    return null;
  }
}
