import test from "node:test";
import assert from "node:assert/strict";
import {
  isResetTokenCurrent,
  signResetToken,
  verifyResetToken,
} from "../lib/reset-token";

process.env.RESET_TOKEN_SECRET =
  "test-only-secret-0123456789abcdef-test-only-secret";

test("reset token is valid only for the password hash used to create it", async () => {
  const token = await signResetToken("user-1", "old-password-hash");
  const payload = await verifyResetToken(token);

  assert.ok(payload);
  assert.equal(payload.userId, "user-1");
  assert.equal(await isResetTokenCurrent(payload, "old-password-hash"), true);
  assert.equal(await isResetTokenCurrent(payload, "new-password-hash"), false);
});

test("tampered reset token is rejected", async () => {
  const token = await signResetToken("user-1", "password-hash");
  assert.equal(await verifyResetToken(`${token}tampered`), null);
});
