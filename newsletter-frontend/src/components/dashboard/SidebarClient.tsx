"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function SidebarClient({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { href: "/dashboard", label: "My Issues", icon: "📝" },
    { href: "/dashboard/profile", label: "Profile", icon: "👤" },
    { href: "/dashboard/timeline", label: "Timeline", icon: "📰" },
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:relative z-50 h-full bg-white border-r border-neutral-200 flex flex-col transition-all duration-300 ${
          sidebarOpen ? "w-72" : "w-0 lg:w-72"
        }`}
      >
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
            <div>
              <h1 className="font-light text-xl tracking-tight text-neutral-900">
                Newsletter<span className="font-normal">.ai</span>
              </h1>
              <p className="text-xs text-neutral-500 font-light mt-1 truncate">
                {userEmail}
              </p>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-neutral-100 transition-colors lg:hidden"
              aria-label="Close sidebar"
            >
              ✕
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-light ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                      : "text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-neutral-200">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl border border-neutral-300 text-neutral-700 hover:bg-neutral-100 transition-all font-light"
            >
              <span>🚪</span>
              <span>Log out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile open button (floating) */}
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed bottom-6 left-6 z-[9999] px-4 py-3 rounded-full bg-neutral-900 text-white shadow-lg"
        aria-label="Open sidebar"
      >
        ☰
      </button>
    </>
  );
}
