"use server";

import { redirect } from "next/navigation";
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

  if (isRateLimited(email)) {
    return {
      error:
        "Terlalu banyak percubaan log masuk gagal untuk akaun ini. Sila cuba lagi selepas 15 minit.",
    };
  }

  const user = await verifyCredentials(email, password);
  if (!user) {
    recordFailedAttempt(email);
    return { error: "Emel atau kata laluan tidak sah." };
  }

  clearAttempts(email);
  await createUserSession(user.id);
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
