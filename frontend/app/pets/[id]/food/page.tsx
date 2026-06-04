"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { petsApi, nutritionApi, subscriptionsApi } from "@/lib/api";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import Link from "next/link";

export default function PetFoodPage({ params }: { params: { id: string } }) {
  const { status } = useSession();
  if (status === "unauthenticated") redirect("/auth/login");

  const petId = params.id;
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [filter, setFilter] = useState<"all" | "safe" | "unsafe">("safe");

  const { data: pet } = useQuery({
    queryKey: ["pet", petId],
    queryFn: () => petsApi.get(petId).then(r => r.data),
  });

  const { data: requirements } = useQuery({
    queryKey: ["nutrition-requirements", petId],
    queryFn: () => nutritionApi.getRequirements(petId).then(r => r.data),
    enabled: !!pet,
  });

  const { data: recommendations = [], isLoading } = useQuery<any[]>({
    queryKey: ["recommendations", petId],
    queryFn: () => nutritionApi.getRecommendations(petId).then(r => r.data),
    enabled: !!pet,
  });

  const { data: activeFood } = useQuery({
    queryKey: ["active-food", petId],
    queryFn: () => subscriptionsApi.getActiveFood(petId).then(r => r.data),
  });

  // Her mama için günlük gram hesapla
  const calcDailyGrams = (food: any) => {
    if (!requirements) return null;
    return Math.round((requirements.daily_calories_kcal / food.calories_kcal) * 100);
  };

  const calcDailyCost = (food: any) => {
    if (!food.price_per_kg || !requirements) return null;
    const grams = calcDailyGrams(food);
    if (!grams) return null;
    return ((grams / 1000) * food.price_per_kg).toFixed(2);
  };

  const safeFoods = recommendations.filter((r: any) => !r.has_allergen);
  const unsafeFoods = recommendations.filter((r: any) => r.has_allergen);
  const activeProductId = activeFood?.product_id;

  const displayedFoods = filter === "safe" ? safeFoods : filter === "unsafe" ? unsafeFoods : recommendations;

  const toggleCompare = (id: string) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const compareItems = compareIds.map(id => recommendations.find((r: any) => r.id === id)).filter(Boolean);

  return (
    <AppLayout backHref={`/pets/${petId}`} backLabel={pet?.name ?? "Geri"}>
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {pet?.species === "dog" ? "🐕" : "🐈"} {pet?.name} — Mama Seçimi
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {pet?.weight_kg} kg · Günlük {requirements ? Math.round(requirements.daily_calories_kcal) : "—"} kcal ihtiyacı
            </p>
          </div>
          {compareIds.length === 2 && (
            <button onClick={() => setShowCompare(!showCompare)}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-bold transition">
              ⚖️ Karşılaştır ({compareIds.length}/2)
            </button>
          )}
        </div>

        {/* Aktif Mama */}
        {activeFood && (
          <div className="mb-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">✅ Şu An Kullanılan Mama</p>
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">ABONELİK</span>
                    <span className="text-xs text-gray-400">{activeFood.frequency === "monthly" ? "Aylık" : "Haftalık"}</span>
                  </div>
                  <p className="text-xs text-gray-400 font-semibold uppercase">{activeFood.brand}</p>
                  <p className="font-bold text-gray-900 text-lg">{activeFood.name}</p>
                </div>
                <Link href={`/subscription/new?petId=${petId}`}
                  className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition flex-shrink-0">
                  Değiştir
                </Link>
              </div>

              {requirements && (
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <ActiveStat
                    label="Günlük Miktar"
                    value={`${calcDailyGrams(activeFood)} g`}
                    sub="önerilen porsiyon"
                    icon="🍽️"
                  />
                  <ActiveStat
                    label="Günlük Maliyet"
                    value={`${calcDailyCost(activeFood)} ₺`}
                    sub={activeFood.price_per_kg ? `${activeFood.price_per_kg} ₺/kg` : ""}
                    icon="💰"
                  />
                  <ActiveStat
                    label="Aylık Maliyet"
                    value={activeFood.price_per_kg ? `${(parseFloat(calcDailyCost(activeFood) || "0") * 30).toFixed(0)} ₺` : "—"}
                    sub="tahmini"
                    icon="📅"
                  />
                </div>
              )}

              {/* Besin karşılama */}
              {requirements && (
                <div className="mt-4 space-y-2">
                  <NutritionBar
                    label="Kalori karşılama"
                    value={Math.round(((calcDailyGrams(activeFood) || 0) * activeFood.calories_kcal / 100 / requirements.daily_calories_kcal) * 100)}
                  />
                  <NutritionBar
                    label="Protein karşılama"
                    value={Math.round(((calcDailyGrams(activeFood) || 0) * activeFood.protein_g / 100 / requirements.daily_protein_g) * 100)}
                  />
                  <NutritionBar
                    label="Yağ karşılama"
                    value={Math.round(((calcDailyGrams(activeFood) || 0) * activeFood.fat_g / 100 / requirements.daily_fat_g) * 100)}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Karşılaştırma paneli */}
        {showCompare && compareItems.length === 2 && (
          <div className="mb-6 bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden">
            <div className="bg-indigo-50 px-5 py-3 flex items-center justify-between">
              <h2 className="font-bold text-indigo-900">⚖️ Mama Karşılaştırması</h2>
              <button onClick={() => setShowCompare(false)} className="text-indigo-400 hover:text-indigo-600 text-sm">Kapat</button>
            </div>
            <div className="grid grid-cols-2 divide-x divide-gray-100">
              {compareItems.map((food: any) => (
                <div key={food.id} className="p-5">
                  <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">{food.brand}</p>
                  <p className="font-bold text-gray-900 mb-4">{food.name}</p>
                  {requirements && (
                    <div className="space-y-3">
                      <CompareRow label="Günlük Miktar" value={`${calcDailyGrams(food)} g`} />
                      <CompareRow label="Günlük Maliyet" value={food.price_per_kg ? `${calcDailyCost(food)} ₺` : "—"} />
                      <CompareRow label="Aylık Maliyet" value={food.price_per_kg ? `${(parseFloat(calcDailyCost(food) || "0") * 30).toFixed(0)} ₺` : "—"} />
                      <CompareRow label="Kalori/100g" value={`${food.calories_kcal} kcal`} />
                      <CompareRow label="Protein/100g" value={`${food.protein_g} g`} />
                      <CompareRow label="Yağ/100g" value={`${food.fat_g} g`} />
                      <CompareRow label="Puan" value={`${Math.round(food.overall_score)}/100`} />
                      <CompareRow label="Alerjen" value={food.has_allergen ? "⚠️ İçeriyor" : "✅ Yok"} />
                    </div>
                  )}
                  <Link href={`/subscription/new?petId=${petId}`}
                    className="block mt-4 text-center py-2 bg-amber-400 hover:bg-amber-500 text-white rounded-xl text-sm font-bold transition">
                    Bu Mamayı Seç
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Karşılaştır ipucu */}
        {compareIds.length > 0 && compareIds.length < 2 && (
          <div className="mb-4 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2 text-sm text-indigo-700">
            ⚖️ Karşılaştırmak için 1 mama daha seç ({compareIds.length}/2)
          </div>
        )}

        {/* Filtre */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">Filtre:</p>
          {[
            { key: "safe", label: `✅ Uygun (${safeFoods.length})` },
            { key: "unsafe", label: `⚠️ Alerjenli (${unsafeFoods.length})` },
            { key: "all", label: `Tümü (${recommendations.length})` },
          ].map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                filter === f.key ? "bg-slate-900 text-white border-slate-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}>
              {f.label}
            </button>
          ))}
          {compareIds.length > 0 && (
            <button onClick={() => setCompareIds([])}
              className="ml-auto px-3 py-1.5 rounded-full text-xs font-semibold border border-red-200 text-red-500 hover:bg-red-50 transition">
              Seçimi Temizle
            </button>
          )}
        </div>

        {/* Mama Listesi */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedFoods.map((food: any) => {
              const isActive = food.id === activeProductId;
              const isSelected = compareIds.includes(food.id);
              const dailyGrams = calcDailyGrams(food);
              const dailyCost = calcDailyCost(food);

              return (
                <div key={food.id}
                  className={`bg-white rounded-2xl border-2 transition-all ${
                    isActive ? "border-amber-300 shadow-md shadow-amber-100" :
                    isSelected ? "border-indigo-400 shadow-md shadow-indigo-100" :
                    food.has_allergen ? "border-red-100" : "border-gray-100 hover:border-gray-300"
                  }`}>
                  <div className="p-5">
                    {/* Badges */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      {isActive && <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">✅ Aktif Mama</span>}
                      {food.has_allergen && <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">⚠️ Alerjen</span>}
                      {food.is_verified && <span className="text-xs font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">✓ Doğrulandı</span>}
                      <div className={`ml-auto text-center px-3 py-1 rounded-xl text-xs font-bold ${
                        food.overall_score >= 75 ? "bg-green-100 text-green-700" :
                        food.overall_score >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                      }`}>
                        {Math.round(food.overall_score)} puan
                      </div>
                    </div>

                    {/* Brand + Name */}
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{food.brand}</p>
                    <p className="font-bold text-gray-900 text-base mb-4">{food.name}</p>

                    {/* Günlük bilgiler */}
                    {requirements && dailyGrams && (
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <InfoBox label="Günlük" value={`${dailyGrams}g`} sub="porsiyon" />
                        <InfoBox label="Maliyet" value={dailyCost ? `${dailyCost}₺` : "—"} sub="/ gün" />
                        <InfoBox label="Aylık" value={dailyCost ? `${(parseFloat(dailyCost) * 30).toFixed(0)}₺` : "—"} sub="tahmini" />
                      </div>
                    )}

                    {/* Besin barları */}
                    <div className="space-y-1.5 mb-4">
                      <MiniBar label="Kalori" pct={food.calorie_coverage_percent} />
                      <MiniBar label="Protein" pct={food.protein_coverage_percent} />
                    </div>

                    {/* Fiyat */}
                    {food.price_per_kg && (
                      <p className="text-xs text-gray-400 mb-4">
                        💰 <span className="font-semibold text-gray-700">{food.price_per_kg} ₺/kg</span>
                        {food.allergens && <span className="ml-2">· İçerik: {food.allergens}</span>}
                      </p>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleCompare(food.id)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                          isSelected
                            ? "bg-indigo-500 text-white border-indigo-500"
                            : "border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600"
                        }`}>
                        {isSelected ? "✓ Seçildi" : "⚖️ Karşılaştır"}
                      </button>
                      {!isActive && (
                        <Link href={`/subscription/new?petId=${petId}&productId=${food.id}`}
                          className="flex-1 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-500 text-white transition text-center">
                          Bu Mamayı Seç
                        </Link>
                      )}
                      {isActive && (
                        <div className="flex-1 py-2 rounded-xl text-xs font-bold bg-gray-100 text-gray-400 text-center">
                          Kullanılıyor
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function ActiveStat({ label, value, sub, icon }: { label: string; value: string; sub: string; icon: string }) {
  return (
    <div className="bg-white rounded-xl p-3 text-center">
      <div className="text-lg mb-1">{icon}</div>
      <p className="font-bold text-gray-900 text-sm">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
      {sub && <p className="text-[10px] text-gray-300">{sub}</p>}
    </div>
  );
}

function InfoBox({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-2.5 text-center">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-bold text-gray-900 text-sm">{value}</p>
      <p className="text-[10px] text-gray-400">{sub}</p>
    </div>
  );
}

function NutritionBar({ label, value }: { label: string; value: number }) {
  const capped = Math.min(value, 120);
  const color = value >= 80 && value <= 120 ? "bg-green-400" : value < 80 ? "bg-amber-400" : "bg-blue-400";
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${(capped / 120) * 100}%` }} />
      </div>
    </div>
  );
}

function MiniBar({ label, pct }: { label: string; pct: number }) {
  const capped = Math.min(pct, 120);
  const color = pct >= 80 ? "bg-green-400" : "bg-amber-400";
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-gray-400 w-12">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${(capped / 120) * 100}%` }} />
      </div>
      <span className="text-[10px] text-gray-400 w-8 text-right">{Math.round(pct)}%</span>
    </div>
  );
}

function CompareRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-xs font-bold text-gray-900">{value}</span>
    </div>
  );
}
