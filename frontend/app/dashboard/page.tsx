"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { petsApi, analyticsApi } from "@/lib/api";
import { PetCard } from "@/components/PetCard";
import { AlertBanner } from "@/components/AlertBanner";
import { WeightChart } from "@/components/WeightChart";
import { redirect } from "next/navigation";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  if (status === "unauthenticated") redirect("/auth/login");

  const { data: pets = [] } = useQuery<any[]>({
    queryKey: ["pets"],
    queryFn: () => petsApi.list().then((r) => r.data),
    enabled: !!session,
  });

  const firstName = session?.user?.name?.split(" ")[0] ?? "";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Merhaba, {firstName}! 👋
          </h1>
          <p className="text-gray-500 mt-1">
            {pets.length > 0
              ? `${pets.length} tuklu dostunuzun sagligi takip altinda`
              : "Hadi ilk tuklu dostunuzu ekleyelim!"}
          </p>
        </div>
        <Link
          href="/pets/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-white rounded-xl text-sm font-semibold shadow-sm shadow-amber-200 transition-all hover:shadow-md flex-shrink-0"
        >
          <span>+</span>
          Hayvan Ekle
        </Link>
      </div>

      {pets.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-8">
          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard emoji="🐾" label="Toplam Hayvan" value={pets.length} color="amber" />
            <StatCard emoji="🐕" label="Kopek" value={pets.filter((p: any) => p.species === "dog").length} color="orange" />
            <StatCard emoji="🐈" label="Kedi" value={pets.filter((p: any) => p.species === "cat").length} color="violet" />
            <StatCard emoji="✅" label="Takip Edilen" value={pets.length} color="green" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-3">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Hayvanlarim</h2>
              {pets.map((pet: any) => (
                <PetCard key={pet.id} pet={pet} />
              ))}
            </div>

            <div className="lg:col-span-2 space-y-5">
              {pets[0] && <WeightChart petId={pets[0].id} />}
              {pets[0] && <HealthAlertsSection petId={pets[0].id} />}
              <div className="grid grid-cols-2 gap-3">
                <QuickLink href="/nutrition" emoji="🍽️" title="Mama Onerileri" desc="Hayvanina ozel onerimiz var" color="amber" />
                <QuickLink href="/supply-chain" emoji="📦" title="Urun Dogrula" desc="Mama orijinalligini kontrol et" color="blue" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ emoji, label, value, color }: { emoji: string; label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    amber: "bg-amber-50 border-amber-100",
    orange: "bg-orange-50 border-orange-100",
    violet: "bg-violet-50 border-violet-100",
    green: "bg-green-50 border-green-100",
  };
  return (
    <div className={`rounded-2xl border p-4 ${colors[color]}`}>
      <div className="text-2xl mb-2">{emoji}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs font-medium mt-0.5 text-gray-500">{label}</div>
    </div>
  );
}

function QuickLink({ href, emoji, title, desc, color }: { href: string; emoji: string; title: string; desc: string; color: string }) {
  const colors: Record<string, string> = {
    amber: "hover:border-amber-200 hover:bg-amber-50/50",
    blue: "hover:border-blue-200 hover:bg-blue-50/50",
  };
  return (
    <Link href={href} className={`bg-white rounded-2xl border border-gray-100 p-4 transition-all hover:shadow-sm ${colors[color]}`}>
      <div className="text-2xl mb-2">{emoji}</div>
      <p className="font-semibold text-gray-900 text-sm">{title}</p>
      <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
    </Link>
  );
}

function HealthAlertsSection({ petId }: { petId: string }) {
  const { data: alerts = [] } = useQuery<any[]>({
    queryKey: ["health-alerts", petId],
    queryFn: () => analyticsApi.getHealthAlerts(petId).then((r) => r.data),
  });
  if (!alerts.length) return null;
  return (
    <div className="space-y-3">
      <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Saglik Uyarilari</h2>
      {alerts.map((alert: any, i: number) => (
        <AlertBanner key={i} alert={alert} />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-5xl mb-6 shadow-sm">
        🐾
      </div>
      <h2 className="text-xl font-bold text-gray-800">Henuz hayvan eklemediniz</h2>
      <p className="text-gray-400 mt-2 max-w-xs text-sm">
        Tuklu dostunuzun sagligini takip etmek icin hemen ekleyin.
      </p>
      <Link
        href="/pets/new"
        className="mt-6 px-6 py-3 bg-amber-400 hover:bg-amber-500 text-white rounded-xl font-semibold shadow-sm shadow-amber-200 transition-all hover:shadow-md"
      >
        🐾 Ilk Hayvanini Ekle
      </Link>
    </div>
  );
}
