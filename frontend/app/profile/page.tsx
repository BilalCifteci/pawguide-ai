"use client";

import { useSession, signOut } from "next-auth/react";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { petsApi } from "@/lib/api";
import Link from "next/link";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  if (status === "unauthenticated") redirect("/auth/login");

  const { data: pets = [] } = useQuery<any[]>({
    queryKey: ["pets"],
    queryFn: () => petsApi.list().then(r => r.data),
    enabled: !!session,
  });

  const name = session?.user?.name ?? "";
  const email = session?.user?.email ?? "";
  const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-20 bg-gradient-to-r from-amber-400 to-orange-500" />
          <div className="px-6 pb-6">
            <div className="flex items-end gap-4 -mt-8 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-md">
                {initials || "?"}
              </div>
              <div className="pb-1">
                <h1 className="text-xl font-bold text-gray-900">{name}</h1>
                <p className="text-sm text-gray-400">{email}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <StatBox label="Hayvan" value={pets.length} icon="🐾" />
              <StatBox label="Kopek" value={pets.filter((p: any) => p.species === "dog").length} icon="🐕" />
              <StatBox label="Kedi" value={pets.filter((p: any) => p.species === "cat").length} icon="🐈" />
            </div>
          </div>
        </div>

        {/* Pets list */}
        {pets.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-3">Hayvanlarim</h2>
            <div className="space-y-2">
              {pets.map((pet: any) => (
                <Link key={pet.id} href={`/pets/${pet.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition group">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-xl">
                    {pet.species === "dog" ? "🐕" : "🐈"}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{pet.name}</p>
                    <p className="text-xs text-gray-400">{pet.weight_kg} kg</p>
                  </div>
                  <span className="text-gray-300 group-hover:text-amber-400 transition">→</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Account settings */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-1">
          <h2 className="font-bold text-gray-900 mb-3">Hesap</h2>
          <MenuItem icon="📧" label="E-posta" value={email} />
          <MenuItem icon="👤" label="Ad Soyad" value={name} />
          <div className="pt-2 border-t border-gray-50 mt-3">
            <button
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition text-sm font-semibold">
              <span className="text-lg">🚪</span>
              Cikis Yap
            </button>
          </div>
        </div>

        {/* App info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-3">Uygulama</h2>
          <div className="space-y-2 text-sm text-gray-500">
            <div className="flex justify-between"><span>Versiyon</span><span className="font-medium text-gray-700">1.0.0</span></div>
            <div className="flex justify-between"><span>Platform</span><span className="font-medium text-gray-700">PawGuide AI</span></div>
            <div className="flex justify-between"><span>Beslenme Standardi</span><span className="font-medium text-gray-700">FEDIAF 2021</span></div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function StatBox({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <div className="text-xl mb-1">{icon}</div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
}

function MenuItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
      <span className="text-lg w-7 text-center">{icon}</span>
      <div className="flex-1">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}
