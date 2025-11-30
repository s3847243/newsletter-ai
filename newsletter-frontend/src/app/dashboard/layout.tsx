"use client";

import { ReactNode, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading, user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <h1 className="font-semibold text-lg">Newsletter AI</h1>
          <p className="text-xs text-gray-500">
            {user?.email}
          </p>
        </div>
        <nav className="flex-1 p-4 space-y-2 text-sm">
          <a href="/dashboard" className="block px-2 py-1 rounded hover:bg-gray-100">
            My issues
          </a>
          <a
            href="/dashboard/profile"
            className="block px-2 py-1 rounded hover:bg-gray-100"
          >
            Profile
          </a>
          <a
            href="/dashboard/timeline"
            className="block px-2 py-1 rounded hover:bg-gray-100"
          >
            Timeline
          </a>
        </nav>
        <button
          onClick={logout}
          className="m-4 py-2 text-sm rounded border text-gray-700 hover:bg-gray-50"
        >
          Log out
        </button>
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}
