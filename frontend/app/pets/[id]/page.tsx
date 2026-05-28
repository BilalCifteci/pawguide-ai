"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { petsApi, nutritionApi, analyticsApi } from "@/lib/api";
import { WeightChart } from "@/components/WeightChart";
import { AlertBanner } from "@/components/AlertBanner";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";

export default function PetDetailPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  if (status === "unauthenticated") redirect("/auth/login");

  const petId = params.id;
  const queryClient = useQueryClient();

  const [weightInput, setWeightInput] = useState("");
  const [calorieInput, setCalorieInput] = useState("");
  const [logMsg, setLogMsg] = useState("");

  const { data: pet, isLoading: petLoading } = useQuery({
    queryKey: ["pet", petId],
    queryFn: () => petsApi.get(petId).then((r) => r.data),
  });

  const { data: requirements } = useQuery({
    queryKey: ["nutrition-requirements", petId],
    queryFn: () => nutritionApi.getRequirements(petId).then((r) => r.data),
    enabled: !!pet,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ["health-alerts", petId],
    queryFn: () => analyticsApi.getHealthAlerts(petId).then((r) => r.data),
    enabled: !!pet,
  });

  const logWeightMutation = useMutation({
    mutationFn: () =>
      petsApi.logWeight(petId, {
        weight_kg: parseFloat(weightInput),
        calorie_intake: calorieInput ? parseFloat(calorieInput) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weight-logs", petId] });
      queryClient.invalidateQueries({ queryKey: ["health-alerts", petId] });
      setWeightInput("");
      setCalorieInput("");
      setLogMsg("✅ Ağırlık kaydedildi!");
      setTimeout(() => setLogMsg(""), 3000);
    },
  });

  if (petLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400">
        Yükleniyor...
      </div>
    );
  }

  if (!pet) return null;

  const emoji = pet.species === "dog" ? "🐕" : "🐈";

  return (
    <AppLayout backHref="/dashboard" backLabel="Dashboard">
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="text-5xl w-16 h-16 flex items-center justify-center bg-indigo-50 rounded-2xl">
            {emoji}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{pet.name}</h1>
            <p className="text-gray-500">{pet.breed ?? pet.species} · {pet.weight_kg} kg</p>
          </div>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-3">
            {alerts.map((alert: any, i: number) => (
              <AlertBanner key={i} alert={alert} />
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weight Chart */}
          <div className="lg:col-span-2">
            <WeightChart petId={petId} />
          </div>

          {/* Log weight form */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
              Ağırlık Kaydet
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Ağırlık (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  placeholder={`${pet.weight_kg}`}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Kalori alımı (kcal, opsiyonel)</label>
                <input
                  type="number"
                  value={calorieInput}
                  onChange={(e) => setCalorieInput(e.target.value)}
                  placeholder="Bugünkü kalori"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {logMsg && <p className="text-sm text-green-600">{logMsg}</p>}
              <button
                onClick={() => logWeightMutation.mutate()}
                disabled={!weightInput || logWeightMutation.isPending}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {logWeightMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>

          {/* Nutrition requirements */}
          {requirements && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
                Günlük Beslenme İhtiyacı
              </h2>
              <div className="space-y-3">
                {[
                  { label: "Kalori", value: `${requirements.daily_calories_kcal} kcal` },
                  { label: "Protein", value: `${requirements.daily_protein_g} g` },
                  { label: "Yağ", value: `${requirements.daily_fat_g} g` },
                  requirements.daily_carbs_g !== null && {
                    label: "Karbonhidrat", value: `${requirements.daily_carbs_g} g`
                  },
                  { label: "Lif", value: `${requirements.daily_fiber_g} g` },
                  { label: "Öğün sayısı", value: `${requirements.feeding_frequency} / gün` },
                ]
                  .filter(Boolean)
                  .map((item: any) => (
                    <div key={item.label} className="flex justify-between text-sm">
                      <span className="text-gray-500">{item.label}</span>
                      <span className="font-medium text-gray-900">{item.value}</span>
                    </div>
                  ))}
              </div>
              <p className="text-xs text-gray-400 mt-4">FEDIAF 2021 standartlarına göre hesaplanmıştır.</p>
            </div>
          )}
        </div>
      </div>
    </div>
    </AppLayout>
  );
}
