"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canManageUsers } from "@/lib/permissions";
import { signResetToken, verifyResetToken } from "@/lib/reset-token";
import { sendEmail } from "@/lib/email";
import { isRateLimited, recordFailedAttempt, clearAttempts } from "@/lib/rate-limit";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

// ---- Self-service: "Lupa kata laluan?" ------------------------------

export type RequestResetState = { message?: string; error?: string };

const GENERIC_SUCCESS_MESSAGE =
  "Jika emel tersebut wujud dalam sistem, pautan set semula kata laluan telah dihantar.";

export async function requestPasswordResetAction(
  _prevState: RequestResetState,
  formData: FormData
): Promise<RequestResetState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) {
    return { error: "Sila isi emel." };
  }

  // Rate limit by email to stop this being used to spam a user's inbox
  // with reset emails, or to enumerate which emails exist via timing.
  const rateLimitKey = `reset:${email}`;
  if (isRateLimited(rateLimitKey)) {
    // Same generic message either way — never reveal whether the email
    // exists or whether it's specifically rate-limited.
    return { message: GENERIC_SUCCESS_MESSAGE };
  }
  recordFailedAttempt(rateLimitKey);

  const user = await prisma.user.findUnique({ where: { email } });

  // Deliberately return the same message whether or not the user exists
  // — telling the requester "no such email" would let anyone check which
  // addresses are registered.
  if (user && user.isActive) {
    const token = await signResetToken(user.id);
    const link = `${APP_URL}/reset-password?token=${token}`;
    await sendEmail({
      to: user.email,
      subject: "Set Semula Kata Laluan — Table 4 FTSM",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px;">
          <p>Terdapat permintaan untuk menetapkan semula kata laluan akaun anda.</p>
          <p><a href="${link}">Klik di sini untuk set semula kata laluan</a></p>
          <p style="font-size: 12px; color: #777;">
            Pautan ini luput dalam 30 minit. Jika anda tidak membuat
            permintaan ini, abaikan sahaja emel ini.
          </p>
        </div>
      `,
    });
  }

  return { message: GENERIC_SUCCESS_MESSAGE };
}

// ---- Self-service: actually set the new password --------------------

export type ResetPasswordState = { error?: string };

export async function resetPasswordAction(
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!token) {
    return { error: "Pautan set semula tidak sah." };
  }
  if (password.length < 8) {
    return { error: "Kata laluan mesti sekurang-kurangnya 8 aksara." };
  }
  if (password !== confirmPassword) {
    return { error: "Kata laluan dan pengesahan tidak sepadan." };
  }

  const userId = await verifyResetToken(token);
  if (!userId) {
    return {
      error: "Pautan set semula tidak sah atau telah luput. Sila mohon pautan baharu.",
    };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  redirect("/login?reset=success");
}

// ---- Admin: reset another user's password directly -------------------

export type AdminResetPasswordState = { error?: string; success?: boolean };

export async function adminResetPasswordAction(
  _prevState: AdminResetPasswordState,
  formData: FormData
): Promise<AdminResetPasswordState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { error: "Sesi telah tamat. Sila log masuk semula." };
  }
  if (!canManageUsers(currentUser)) {
    return { error: "Hanya Admin boleh menetapkan semula kata laluan pengguna." };
  }

  const userId = String(formData.get("userId") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");

  if (!userId || !newPassword) {
    return { error: "Data tidak lengkap." };
  }
  if (newPassword.length < 8) {
    return { error: "Kata laluan mesti sekurang-kurangnya 8 aksara." };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  return { success: true };
}
