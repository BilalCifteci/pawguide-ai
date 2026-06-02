"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { petsApi, analyticsApi } from "@/lib/api";
import { PetCard } from "@/components/PetCard";
import { AlertBanner } from "@/components/AlertBanner";
import { WeightChart } from "@/components/WeightChart";
import { redirect } from "next/navigation";

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === "unauthenticated") redirect("/auth/login");

  const { data: petsData } = useQuery({
    queryKey: ["pets"],
    queryFn: () => petsApi.list().then((r) => r.data),
    enabled: !!session,
  });

  const pets = petsData ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            Merhaba, {session?.user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-gray-500 mt-1">Evcil hayvanlarınızın sağlık durumu</p>
        </div>

        {pets.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pets */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Hayvanlarım
              </h2>
              {pets.map((pet: any) => (
                <PetCard key={pet.id} pet={pet} />
              ))}
            </div>

            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {pets[0] && <WeightChart petId={pets[0].id} />}
              {pets[0] && <HealthAlertsSection petId={pets[0].id} />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function HealthAlertsSection({ petId }: { petId: string }) {
  const { data: alerts = [] } = useQuery({
    queryKey: ["health-alerts", petId],
    queryFn: () => analyticsApi.getHealthAlerts(petId).then((r) => r.data),
  });

  if (!alerts.length) return null;

  return (
    <div>
      <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
        Sağlık Uyarıları
      </h2>
      <div className="space-y-3">
        {alerts.map((alert: any, i: number) => (
          <AlertBanner key={i} alert={alert} />
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-24">
      <div className="text-6xl mb-4">🐾</div>
      <h2 className="text-xl font-semibold text-gray-800">Henüz hayvan eklemediniz</h2>
      <p className="text-gray-500 mt-2">
        İlk evcil hayvanınızı ekleyerek başlayın.
      </p>
      <a
        href="/pets/new"
        className="mt-6 inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
      >
        Hayvan Ekle
      </a>
    </div>
  );
}
# dashboard
