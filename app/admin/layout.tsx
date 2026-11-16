import { Suspense, type ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: { default: "Admin Console", template: "%s | Free Course Link Admin" },
};

async function AdminAuthGuard({ children }: { children: ReactNode }) {
  const h = await headers();
  const pathname = h.get("x-pathname") || "";

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  try {
    await requireAdmin();
  } catch {
    redirect("/admin/login");
  }

  return <AdminShell>{children}</AdminShell>;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg" />}>
      <AdminAuthGuard>{children}</AdminAuthGuard>
    </Suspense>
  );
}
