"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { petsApi } from "@/lib/api";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Ana Sayfa", icon: "🏠" },
  { href: "/nutrition", label: "Mama Onerileri", icon: "🍽️" },
  { href: "/supply-chain", label: "Urun Dogrula", icon: "📦" },
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
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6">
        <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
          <div className="w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center text-lg shadow-sm">
            🐾
          </div>
          <div>
            <span className="font-bold text-white text-base tracking-tight">PawGuide</span>
            <span className="ml-1.5 text-[10px] font-semibold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-md">AI</span>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-thin">
        <p className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
          Menu
        </p>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-amber-400/15 text-amber-400"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400" />}
            </Link>
          );
        })}

        {/* Pets section */}
        <div className="pt-4">
          <div className="flex items-center justify-between px-3 mb-1.5">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
              Hayvanlarim
            </p>
            <Link
              href="/pets/new"
              onClick={() => setMobileOpen(false)}
              className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/20 transition text-xs font-bold"
              title="Hayvan Ekle"
            >
              +
            </Link>
          </div>

          {pets.length === 0 ? (
            <Link
              href="/pets/new"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-500 hover:bg-white/5 hover:text-slate-300 transition border border-dashed border-slate-700 mx-1 mt-1"
            >
              <span className="text-base">+</span>
              <span>Hayvan ekle</span>
            </Link>
          ) : (
            pets.map((pet: any) => {
              const isActive = pathname === `/pets/${pet.id}`;
              return (
                <Link
                  key={pet.id}
                  href={`/pets/${pet.id}`}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-amber-400/15 text-amber-400"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-sm">
                    {pet.species === "dog" ? "🐕" : "🐈"}
                  </div>
                  <span className="truncate">{pet.name}</span>
                  <span className="ml-auto text-xs text-slate-600">{pet.weight_kg}kg</span>
                </Link>
              );
            })
          )}
        </div>
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-2 mb-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            {session?.user?.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{session?.user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{session?.user?.email}</p>
          </div>
        </div>
        <Link href="/profile" onClick={() => setMobileOpen(false)}
          className="w-full text-xs text-slate-400 hover:text-white py-2 px-3 rounded-xl hover:bg-white/10 transition text-left flex items-center gap-2 mb-1">
          <span>👤</span> Profilim
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="w-full text-xs text-slate-500 hover:text-red-400 py-2 px-3 rounded-xl hover:bg-red-400/10 transition text-left flex items-center gap-2"
        >
          <span>🚪</span> Cikis Yap
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-stone-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 min-h-screen bg-slate-900 flex-col fixed top-0 left-0 h-full z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-60 bg-slate-900 flex flex-col z-50 transform transition-transform duration-300 ease-out lg:hidden ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 px-4 sm:px-6 py-3.5 flex items-center gap-3 sticky top-0 z-20">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {backHref ? (
            <button
              onClick={() => router.push(backHref)}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {backLabel ?? "Geri"}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">
                {NAV_ITEMS.find(n => pathname.startsWith(n.href))?.icon}
              </span>
              <span className="text-sm font-semibold text-gray-700">
                {NAV_ITEMS.find(n => pathname.startsWith(n.href))?.label ?? "PawGuide AI"}
              </span>
            </div>
          )}

          <div className="flex-1" />

          {/* Mobile user */}
          <div className="lg:hidden w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
            {session?.user?.name?.[0]?.toUpperCase() ?? "?"}
          </div>
        </header>

        <main className="flex-1 pb-20 lg:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 shadow-lg">
        <div className="flex items-center justify-around px-2 py-2">
          {[
            { href: "/dashboard", icon: "🏠", label: "Ana Sayfa" },
            { href: "/nutrition", icon: "🍽️", label: "Mama" },
            { href: "/pets/new", icon: "➕", label: "Ekle", special: true },
            { href: "/supply-chain", icon: "📦", label: "Dogrula" },
            { href: "/subscription", icon: "🔄", label: "Abonelik" },
          ].map((item) => {
            const isActive = pathname === item.href;
            if (item.special) {
              return (
                <Link key={item.href} href={item.href}
                  className="flex flex-col items-center -mt-4">
                  <div className="w-12 h-12 rounded-full bg-amber-400 hover:bg-amber-500 flex items-center justify-center text-white text-xl shadow-md shadow-amber-200 transition">
                    {item.icon}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1">{item.label}</span>
                </Link>
              );
            }
            return (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                className={`flex flex-col items-center px-2 py-1 rounded-xl transition min-w-0 ${
                  isActive ? "text-amber-500" : "text-gray-400 hover:text-gray-600"
                }`}>
                <span className="text-xl">{item.icon}</span>
                <span className="text-[10px] mt-0.5 font-medium truncate">{item.label}</span>
                {isActive && <div className="w-1 h-1 rounded-full bg-amber-400 mt-0.5" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
