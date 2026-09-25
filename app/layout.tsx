import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { canManageCatalog, canManageUsers } from "@/lib/permissions";
import { AppShell } from "@/components/app-shell";
import type { SidebarUser } from "@/components/sidebar";
import type { ReactNode } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Table 4 FTSM — Pengurusan Proforma Kursus",
  description: "Sistem pengurusan Table 4 (proforma kursus) FTSM, UKM",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const currentUser = await getCurrentUser();

  // Only pass the fields the sidebar (a Client Component) actually needs
  // across the server/client boundary — never the full user record,
  // which includes passwordHash.
  const sidebarUser: SidebarUser | null = currentUser
    ? {
        name: currentUser.name,
        email: currentUser.email,
        canManageCatalog: canManageCatalog(currentUser),
        canManageUsers: canManageUsers(currentUser),
      }
    : null;

  return (
    <html
      lang="ms"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppShell user={sidebarUser}>{children}</AppShell>
      </body>
    </html>
  );
}
