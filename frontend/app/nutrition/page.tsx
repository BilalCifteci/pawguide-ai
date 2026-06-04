"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { petsApi, nutritionApi } from "@/lib/api";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";

export default function NutritionPage() {
  const { data: session, status } = useSession();
  if (status === "unauthenticated") redirect("/auth/login");

  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);

  const { data: pets = [] } = useQuery<any[]>({
    queryKey: ["pets"],
    queryFn: () => petsApi.list().then((r) => r.data),
    enabled: !!session,
  } as any);

  useEffect(() => {
    if (pets.length > 0 && !selectedPetId) setSelectedPetId(pets[0].id);
  }, [pets, selectedPetId]);

  const selectedPet = pets.find((p: any) => p.id === selectedPetId);

  const { data: recommendations = [], isLoading } = useQuery<any[]>({
    queryKey: ["recommendations", selectedPetId],
    queryFn: () => nutritionApi.getRecommendations(selectedPetId!).then((r) => r.data),
    enabled: !!selectedPetId,
  });

  const safeFoods = recommendations.filter((r: any) => !r.has_allergen);
  const unsafeFoods = recommendations.filter((r: any) => r.has_allergen);

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">🍽️ Mama Önerileri</h1>
          <p className="text-gray-500 text-sm mt-1">
            Hayvanınızın özelliklerine göre puanlanmış mama listesi
          </p>
        </div>

        {/* Pet selector */}
        {pets.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🐾</div>
            <h2 className="text-lg font-semibold text-gray-800">Önce bir hayvan ekleyin</h2>
            <a href="/pets/new" className="mt-4 inline-block px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
              Hayvan Ekle
            </a>
          </div>
        ) : (
          <>
            {/* Pet tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {pets.map((pet: any) => (
                <button
                  key={pet.id}
                  onClick={() => setSelectedPetId(pet.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition ${
                    selectedPetId === pet.id
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400"
                  }`}
                >
                  <span>{pet.species === "dog" ? "🐕" : "🐈"}</span>
                  {pet.name}
                </button>
              ))}
            </div>

            {/* Allergen info */}
            {selectedPet?.known_allergies && (
              <div className="mb-5 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                <span className="text-lg">⚠️</span>
                <span>
                  <strong>{selectedPet.name}</strong> şu maddelere alerjik:{" "}
                  <span className="font-semibold">{selectedPet.known_allergies}</span>
                  {" "}— alerjenli mamalar aşağıda kırmızıyla işaretlendi.
                </span>
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-16 text-gray-400">Hesaplanıyor...</div>
            ) : (
              <>
                {/* Safe foods */}
                {safeFoods.length > 0 && (
                  <section className="mb-8">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      ✅ Uygun Mamalar ({safeFoods.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {safeFoods.map((food: any) => (
                        <FoodCard key={food.id} food={food} safe={true} />
                      ))}
                    </div>
                  </section>
                )}

                {/* Unsafe foods */}
                {unsafeFoods.length > 0 && (
                  <section>
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      ❌ Alerjen İçeren Mamalar ({unsafeFoods.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {unsafeFoods.map((food: any) => (
                        <FoodCard key={food.id} food={food} safe={false} />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}

function FoodCard({ food, safe }: { food: any; safe: boolean }) {
  const scoreColor =
    food.overall_score >= 75
      ? "text-green-600 bg-green-50"
      : food.overall_score >= 50
      ? "text-amber-600 bg-amber-50"
      : "text-red-600 bg-red-50";

  const borderColor = safe ? "border-gray-200 hover:border-indigo-300" : "border-red-200 bg-red-50/30";

  return (
    <div className={`bg-white rounded-xl border ${borderColor} p-5 transition`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              {food.brand}
            </span>
            {food.is_verified && (
              <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">
                ✓ Doğrulandı
              </span>
            )}
            {!safe && (
              <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">
                ⚠️ Alerjen
              </span>
            )}
          </div>
          <h3 className="font-semibold text-gray-900 text-sm leading-snug">{food.name}</h3>
        </div>

        {/* Score badge */}
        <div className={`text-center px-3 py-1.5 rounded-xl ${scoreColor} flex-shrink-0`}>
          <div className="text-lg font-bold leading-none">{Math.round(food.overall_score)}</div>
          <div className="text-xs">puan</div>
        </div>
      </div>

      {/* Nutrition bars */}
      <div className="mt-4 space-y-2">
        <NutritionBar label="Kalori" value={food.calorie_coverage_percent} />
        <NutritionBar label="Protein" value={food.protein_coverage_percent} />
      </div>

      {/* Stats */}
      <div className="mt-3 flex gap-4 text-xs text-gray-500">
        <span>🔥 {food.calories_kcal} kcal/100g</span>
        <span>💪 {food.protein_g}g protein</span>
        <span>🫙 {food.fat_g}g yağ</span>
      </div>

      {/* Allergens */}
      {food.allergens && (
        <div className="mt-2 text-xs text-gray-400">
          İçerik: {food.allergens.split(",").join(", ")}
        </div>
      )}
    </div>
  );
}

function NutritionBar({ label, value }: { label: string; value: number }) {
  const capped = Math.min(value, 120);
  const color =
    value >= 80 && value <= 120
      ? "bg-green-400"
      : value < 80
      ? "bg-amber-400"
      : "bg-blue-400";

  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-0.5">
        <span>{label}</span>
        <span>{Math.round(value)}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${(capped / 120) * 100}%` }}
        />
      </div>
    </div>
  );
}
