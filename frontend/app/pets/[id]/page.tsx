"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { petsApi, nutritionApi, analyticsApi } from "@/lib/api";
import { WeightChart } from "@/components/WeightChart";
import { AlertBanner } from "@/components/AlertBanner";
import { DietCard } from "@/components/DietCard";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import Link from "next/link";
import { getBreedLabel, getActivityLabel, ACTIVITY_LABELS } from "@/lib/petLabels";

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

  const { data: alerts = [] } = useQuery<any[]>({
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
      queryClient.invalidateQueries({ queryKey: ["diet", petId] });
      queryClient.invalidateQueries({ queryKey: ["pet", petId] });
      setWeightInput("");
      setCalorieInput("");
      setLogMsg("Agirlik kaydedildi!");
      setTimeout(() => setLogMsg(""), 3000);
    },
  });

  if (petLoading) {
    return (
      <AppLayout backHref="/dashboard" backLabel="Dashboard">
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!pet) return null;

  const emoji = pet.species === "dog" ? "🐕" : "🐈";
  const breedLabel = getBreedLabel(pet.breed) || (pet.species === "dog" ? "Kopek" : "Kedi");
  const activityLabel = getActivityLabel(pet.activity_level);

  return (
    <AppLayout backHref="/dashboard" backLabel="Dashboard">
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-16 h-16 flex items-center justify-center bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl text-4xl flex-shrink-0">
            {emoji}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">{pet.name}</h1>
            <div className="flex flex-wrap gap-2 mt-1.5">
              <Tag>{breedLabel}</Tag>
              <Tag>{pet.weight_kg} kg</Tag>
              <Tag>{pet.sex === "male" ? "Erkek ♂" : "Disi ♀"}</Tag>
              <Tag>{activityLabel}</Tag>
              {pet.is_neutered && <Tag color="purple">Kisir</Tag>}
              {pet.known_allergies && <Tag color="red">Alerji: {pet.known_allergies}</Tag>}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Link href={`/pets/${petId}/health`}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl text-sm font-semibold transition">
              💉 Saglik
            </Link>
            <Link href={`/pets/${petId}/edit`}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition">
              ✏️ Duzenle
            </Link>
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

          {/* Diet Analysis */}
          <div className="lg:col-span-2">
            <DietCard petId={petId} petName={pet.name} />
          </div>

          {/* Log weight form */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">⚖️</span>
              <h2 className="font-bold text-gray-900">Agirlik Kaydet</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Agirlik (kg)</label>
                <input type="number" step="0.1" value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  placeholder={`${pet.weight_kg}`}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Kalori (kcal, opsiyonel)</label>
                <input type="number" value={calorieInput}
                  onChange={(e) => setCalorieInput(e.target.value)}
                  placeholder="Bugunku kalori alimi"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50" />
              </div>
              {logMsg && <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-xl">✅ {logMsg}</p>}
              <button onClick={() => logWeightMutation.mutate()}
                disabled={!weightInput || logWeightMutation.isPending}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-500 text-white rounded-xl text-sm font-bold transition disabled:opacity-50">
                {logWeightMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>

          {/* Nutrition requirements */}
          {requirements && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🥗</span>
                <h2 className="font-bold text-gray-900">Gunluk Beslenme Ihtiyaci</h2>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Kalori", value: `${requirements.daily_calories_kcal} kcal`, icon: "🔥" },
                  { label: "Protein", value: `${requirements.daily_protein_g} g`, icon: "💪" },
                  { label: "Yag", value: `${requirements.daily_fat_g} g`, icon: "🫙" },
                  requirements.daily_carbs_g !== null && { label: "Karbonhidrat", value: `${requirements.daily_carbs_g} g`, icon: "🌾" },
                  { label: "Lif", value: `${requirements.daily_fiber_g} g`, icon: "🥬" },
                  { label: "Ogun sayisi", value: `${requirements.feeding_frequency} / gun`, icon: "🍽️" },
                ].filter(Boolean).map((item: any) => (
                  <div key={item.label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-500 flex items-center gap-2"><span>{item.icon}</span>{item.label}</span>
                    <span className="text-sm font-bold text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-300 mt-3">FEDIAF 2021 standartlarina gore</p>
            </div>
          )}
        </div>
      </div>
    </div>
    </AppLayout>
  );
}

function Tag({ children, color = "gray" }: { children: React.ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    gray: "bg-gray-100 text-gray-600",
    purple: "bg-purple-100 text-purple-700",
    red: "bg-red-100 text-red-600",
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${colors[color]}`}>{children}</span>
  );
}
