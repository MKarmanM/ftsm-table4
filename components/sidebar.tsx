"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenText, FolderCog, Users, ScrollText, LogOut } from "lucide-react";
import { logoutAction } from "@/app/login/actions";

export type SidebarUser = {
  name: string;
  email: string;
  canManageCatalog: boolean;
  canManageUsers: boolean;
};

type NavItem = {
  href: string;
  label: string;
  icon: typeof BookOpenText;
  show: (user: SidebarUser) => boolean;
  isActive: (pathname: string) => boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Senarai Kursus",
    icon: BookOpenText,
    show: () => true,
    isActive: (pathname) => pathname === "/",
  },
  {
    href: "/admin",
    label: "Urus Katalog",
    icon: FolderCog,
    show: (user) => user.canManageCatalog,
    isActive: (pathname) =>
      pathname === "/admin" ||
      pathname.startsWith("/admin/programmes") ||
      pathname.startsWith("/admin/courses"),
  },
  {
    href: "/admin/users",
    label: "Urus Pengguna",
    icon: Users,
    show: (user) => user.canManageUsers,
    isActive: (pathname) => pathname.startsWith("/admin/users"),
  },
  {
    href: "/admin/audit",
    label: "Log Audit",
    icon: ScrollText,
    show: (user) => user.canManageCatalog,
    isActive: (pathname) => pathname.startsWith("/admin/audit"),
  },
];

export function Sidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-border bg-muted/20 sm:h-screen sm:w-56 sm:border-b-0 sm:border-r sm:sticky sm:top-0 print:hidden">
      <div className="border-b border-border px-4 py-4">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          FTSM &middot; UKM
        </p>
        <p className="mt-0.5 text-sm font-semibold text-foreground">
          Table 4
        </p>
      </div>

      <nav className="flex flex-row gap-1 overflow-x-auto p-2 sm:flex-1 sm:flex-col sm:gap-0.5 sm:overflow-visible sm:p-3">
        {NAV_ITEMS.filter((item) => item.show(user)).map((item) => {
          const active = item.isActive(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="px-1 pb-2">
          <p className="truncate text-sm font-medium text-foreground">
            {user.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {user.email}
          </p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="size-4 shrink-0" />
            Log Keluar
          </button>
        </form>
      </div>
    </aside>
  );
}
