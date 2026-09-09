"use client";

import { usePathname } from "next/navigation";
import { Sidebar, type SidebarUser } from "@/components/sidebar";

export function AppShell({
  user,
  children,
}: {
  user: SidebarUser | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname.startsWith("/login");

  if (isLoginPage || !user) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      <Sidebar user={user} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
