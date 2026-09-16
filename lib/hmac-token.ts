function base64UrlEncode(bytes: Uint8Array): string {
  let value = "";
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");
  const decoded = atob(padded);
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}

export function timingSafeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return result === 0;
}

async function hmac(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data)
  );
  return base64UrlEncode(new Uint8Array(signature));
}

export async function signHmacPayload<T extends object>(
  payload: T,
  secret: string
): Promise<string> {
  const payloadString = base64UrlEncode(
    new TextEncoder().encode(JSON.stringify(payload))
  );
  return `${payloadString}.${await hmac(payloadString, secret)}`;
}

export async function verifyHmacPayload<T>(
  token: string | undefined,
  secret: string
): Promise<T | null> {
  if (!token) return null;
  const [payloadString, signature, extra] = token.split(".");
  if (!payloadString || !signature || extra) return null;

  const expectedSignature = await hmac(payloadString, secret);
  if (!timingSafeEqual(expectedSignature, signature)) return null;

  try {
    return JSON.parse(
      new TextDecoder().decode(base64UrlDecode(payloadString))
    ) as T;
  } catch {
    return null;
  }
}

export async function sha256Fingerprint(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value)
  );
  return base64UrlEncode(new Uint8Array(digest));
}
