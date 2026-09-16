"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { verifyCredentials, createUserSession, destroySession } from "@/lib/auth";
import { isRateLimited, recordFailedAttempt, clearAttempts } from "@/lib/rate-limit";

export type LoginState = { error?: string };

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Sila isi emel dan kata laluan." };
  }

  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwardedFor || requestHeaders.get("x-real-ip") || "unknown";
  const accountKey = `login:${ip}:${email}`;
  const ipKey = `login-ip:${ip}`;

  if (isRateLimited(accountKey) || isRateLimited(ipKey, 50)) {
    return {
      error:
        "Terlalu banyak percubaan log masuk gagal untuk akaun ini. Sila cuba lagi selepas 15 minit.",
    };
  }

  const user = await verifyCredentials(email, password);
  if (!user) {
    recordFailedAttempt(accountKey);
    recordFailedAttempt(ipKey);
    return { error: "Emel atau kata laluan tidak sah." };
  }

  clearAttempts(accountKey);
  await createUserSession(user.id);
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
