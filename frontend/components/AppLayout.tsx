"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { petsApi } from "@/lib/api";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Ana Sayfa", icon: "🏠" },
  { href: "/supply-chain", label: "Ürün Doğrula", icon: "📦" },
  { href: "/subscription", label: "Abonelik", icon: "🔄" },
];

export function AppLayout({ children, backHref, backLabel }: {
  children: React.ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: pets = [] } = useQuery<any[]>({
    queryKey: ["pets"],
    queryFn: () => petsApi.list().then((r) => r.data),
    enabled: !!session,
  });

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
          <span className="text-2xl">🐾</span>
          <span className="font-bold text-gray-900 text-lg">PawGuide</span>
          <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">AI</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}

        {/* Pets section */}
        <div className="pt-4">
          <div className="flex items-center justify-between px-3 mb-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Hayvanlarım</span>
            <Link
              href="/pets/new"
              onClick={() => setMobileOpen(false)}
              className="text-indigo-500 hover:text-indigo-700 text-lg leading-none"
              title="Hayvan Ekle"
            >
              +
            </Link>
          </div>

          {pets.length === 0 ? (
            <Link
              href="/pets/new"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-50 transition"
            >
              <span>➕</span> Hayvan ekle
            </Link>
          ) : (
            pets.map((pet: any) => {
              const isActive = pathname === `/pets/${pet.id}`;
              return (
                <Link
                  key={pet.id}
                  href={`/pets/${pet.id}`}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span>{pet.species === "dog" ? "🐕" : "🐈"}</span>
                  <span className="truncate">{pet.name}</span>
                </Link>
              );
            })
          )}
        </div>
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm">
            {session?.user?.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{session?.user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{session?.user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="w-full text-xs text-gray-500 hover:text-red-600 py-1.5 rounded-lg hover:bg-gray-50 transition text-left px-2"
        >
          🚪 Çıkış Yap
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 min-h-screen bg-white border-r border-gray-200 flex-col fixed top-0 left-0 h-full z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col z-50 transform transition-transform duration-200 lg:hidden ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Back button */}
          {backHref && (
            <button
              onClick={() => router.push(backHref)}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {backLabel ?? "Geri"}
            </button>
          )}

          {/* Breadcrumb / page title */}
          {!backHref && (
            <span className="text-sm text-gray-400">
              {NAV_ITEMS.find(n => pathname.startsWith(n.href))?.label ?? "PawGuide AI"}
            </span>
          )}

          <div className="flex-1" />

          {/* User avatar mobile */}
          <div className="lg:hidden w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm">
            {session?.user?.name?.[0]?.toUpperCase() ?? "?"}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
