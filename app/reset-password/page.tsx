import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-sm">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          FTSM &middot; UKM
        </p>
        <h1 className="mt-1 text-xl font-semibold text-foreground">
          Set Semula Kata Laluan
        </h1>

        {!token ? (
          <p className="mt-4 text-sm text-destructive">
            Pautan set semula tidak sah. Sila mohon pautan baharu melalui
            halaman &quot;Lupa Kata Laluan&quot;.
          </p>
        ) : (
          <ResetPasswordForm token={token} />
        )}
      </div>
    </div>
  );
}
