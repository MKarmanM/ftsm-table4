import {
  sha256Fingerprint,
  signHmacPayload,
  timingSafeEqual,
  verifyHmacPayload,
} from "./hmac-token";

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

export type ResetTokenPayload = {
  userId: string;
  purpose: "password_reset";
  passwordFingerprint: string;
  exp: number;
};

function getSecret(): string {
  const secret = process.env.RESET_TOKEN_SECRET;
  if (!secret) {
    throw new Error("RESET_TOKEN_SECRET belum ditetapkan dalam .env.");
  }
  return secret;
}

export async function signResetToken(
  userId: string,
  passwordHash: string
): Promise<string> {
  return signHmacPayload<ResetTokenPayload>(
    {
      userId,
      purpose: "password_reset",
      passwordFingerprint: await sha256Fingerprint(passwordHash),
      exp: Date.now() + RESET_TOKEN_TTL_MS,
    },
    getSecret()
  );
}

export async function verifyResetToken(
  token: string
): Promise<ResetTokenPayload | null> {
  const payload = await verifyHmacPayload<ResetTokenPayload>(token, getSecret());
  if (!payload || payload.purpose !== "password_reset") return null;
  if (typeof payload.userId !== "string") return null;
  if (typeof payload.passwordFingerprint !== "string") return null;
  if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
  return payload;
}

export async function isResetTokenCurrent(
  payload: ResetTokenPayload,
  passwordHash: string
): Promise<boolean> {
  const currentFingerprint = await sha256Fingerprint(passwordHash);
  return timingSafeEqual(payload.passwordFingerprint, currentFingerprint);
}
