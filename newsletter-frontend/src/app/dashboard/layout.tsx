import SidebarClient from "@/components/dashboard/SidebarClient";
import TopbarClient from "@/components/dashboard/TopbarClient";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { cookies } from "next/headers";

type Me = { id: string; email: string };

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const cookieHeader = (await cookies()).toString();

  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/proxy/auth/me`, {
    method: "GET",
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });

  

  const me = (await res.json()) as Me;

  return (
    <div className="h-screen flex bg-gradient-to-br from-neutral-50 via-white to-neutral-50 overflow-hidden">
      <SidebarClient userEmail={me.email} />
      <main className="flex-1 overflow-y-auto">
        <TopbarClient />
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}