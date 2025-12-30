import { apiFetchServer } from "@/lib/apiFetchServer";
import SidebarClient from "@/components/dashboard/SidebarClient";
import TopbarClient from "@/components/dashboard/TopbarClient";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
type Me = { id: string; email: string };

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  let me: Me | null = null;

  try {
    me = await apiFetchServer<Me>("/auth/me", { method: "GET" });
  } catch {
    me = null;
    redirect("/login")
  }

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