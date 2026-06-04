"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { petsApi, nutritionApi, subscriptionsApi } from "@/lib/api";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import Link from "next/link";

export default function MamalarPage() {
  const { data: session, status } = useSession();
  if (status === "unauthenticated") redirect("/auth/login");

  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"safe" | "all">("safe");
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: pets = [] } = useQuery<any[]>({
    queryKey: ["pets"],
    queryFn: () => petsApi.list().then(r => r.data),
    enabled: !!session,
  });

  const petId = selectedPetId ?? pets[0]?.id ?? null;
  const selectedPet = pets.find((p: any) => p.id === petId);

  const { data: recommendations = [], isLoading } = useQuery<any[]>({
    queryKey: ["recommendations", petId],
    queryFn: () => nutritionApi.getRecommendations(petId!).then(r => r.data),
    enabled: !!petId,
  });

  const { data: requirements } = useQuery({
    queryKey: ["nutrition-requirements", petId],
    queryFn: () => nutritionApi.getRequirements(petId!).then(r => r.data),
    enabled: !!petId,
  });

  const { data: activeFood } = useQuery({
    queryKey: ["active-food", petId],
    queryFn: () => subscriptionsApi.getActiveFood(petId!).then(r => r.data),
    enabled: !!petId,
  });

  const calcDaily = (food: any) => {
    if (!requirements) return null;
    return Math.round((requirements.daily_calories_kcal / food.calories_kcal) * 100);
  };
  const calcCost = (food: any) => {
    const g = calcDaily(food);
    if (!food.price_per_kg || !g) return null;
    return ((g / 1000) * food.price_per_kg).toFixed(2);
  };

  const safeFoods = recommendations.filter((r: any) => !r.has_allergen);
  const displayed = filter === "safe" ? safeFoods : recommendations;

  const toggleCompare = (id: string) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const compareItems = compareIds.map(id => recommendations.find((r: any) => r.id === id)).filter(Boolean);

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">🍽️ Mamalar</h1>
          <p className="text-gray-400 text-sm mt-1">Hayvanınız için en uygun mamayı bulun, karşılaştırın</p>
        </div>

        {pets.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🐾</div>
            <p className="font-semibold text-gray-700">Önce bir hayvan ekleyin</p>
            <Link href="/pets/new" className="mt-4 inline-block px-5 py-2.5 bg-amber-400 text-white rounded-xl text-sm font-bold hover:bg-amber-500 transition">
              Hayvan Ekle
            </Link>
          </div>
        ) : (
          <>
            {/* Hayvan Seçici */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Hangi hayvan için?</p>
              <div className="flex gap-2 flex-wrap">
                {pets.map((pet: any) => {
                  const isActive = pet.id === petId;
                  return (
                    <button key={pet.id} onClick={() => { setSelectedPetId(pet.id); setCompareIds([]); setExpandedId(null); }}
                      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition ${
                        isActive ? "border-amber-400 bg-amber-50 text-amber-700" : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300"
                      }`}>
                      <span className="text-lg">{pet.species === "dog" ? "🐕" : "🐈"}</span>
                      <div className="text-left">
                        <p>{pet.name}</p>
                        <p className={`text-[10px] font-normal ${isActive ? "text-amber-500" : "text-gray-400"}`}>
                          {pet.weight_kg} kg · {requirements && isActive ? `${Math.round(requirements.daily_calories_kcal)} kcal/gün` : ""}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Alerjen uyarısı */}
              {selectedPet?.known_allergies && (
                <div className="mt-3 flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-sm text-amber-700">
                  <span>⚠️</span>
                  <span><strong>{selectedPet.name}</strong> şuna alerjik: <strong>{selectedPet.known_allergies}</strong> — alerjenli mamalar listelenmez</span>
                </div>
              )}
            </div>

            {/* Aktif mama */}
            {activeFood && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-4 mb-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-200 flex items-center justify-center text-xl flex-shrink-0">🥘</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-amber-600 font-bold">✅ {selectedPet?.name} Şu An Kullanıyor</p>
                  <p className="font-bold text-gray-900 truncate">{activeFood.brand} — {activeFood.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {activeFood.daily_amount_g && `${activeFood.daily_amount_g}g/gün`}
                    {activeFood.price_per_kg && activeFood.daily_amount_g && ` · ${((activeFood.daily_amount_g/1000)*activeFood.price_per_kg).toFixed(2)} ₺/gün`}
                  </p>
                </div>
                <Link href={`/pets/${petId}/food`}
                  className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition flex-shrink-0">
                  Değiştir
                </Link>
              </div>
            )}

            {/* Filtre + Karşılaştır */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <button onClick={() => setFilter("safe")}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${filter === "safe" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-gray-600 border-gray-200"}`}>
                ✅ Uygun ({safeFoods.length})
              </button>
              <button onClick={() => setFilter("all")}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${filter === "all" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-gray-600 border-gray-200"}`}>
                Tümü ({recommendations.length})
              </button>
              {compareIds.length > 0 && (
                <>
                  <button onClick={() => setCompareIds([])}
                    className="px-3 py-1.5 rounded-full text-xs font-bold border border-red-200 text-red-500 hover:bg-red-50 transition">
                    Seçimi Temizle
                  </button>
                  {compareIds.length === 2 && (
                    <button onClick={() => setExpandedId("compare")}
                      className="px-4 py-1.5 rounded-full text-xs font-bold bg-indigo-500 text-white hover:bg-indigo-600 transition">
                      ⚖️ Karşılaştır (2)
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Karşılaştırma Paneli */}
            {expandedId === "compare" && compareItems.length === 2 && (
              <div className="bg-white rounded-2xl border border-indigo-200 shadow-md mb-5 overflow-hidden">
                <div className="bg-indigo-50 px-5 py-3 flex items-center justify-between border-b border-indigo-100">
                  <h2 className="font-bold text-indigo-900">⚖️ Karşılaştırma</h2>
                  <button onClick={() => setExpandedId(null)} className="text-indigo-400 hover:text-indigo-600 text-xl">✕</button>
                </div>
                <div className="grid grid-cols-2 divide-x divide-gray-100">
                  {compareItems.map((food: any) => (
                    <div key={food.id} className="p-5">
                      <p className="text-xs text-gray-400 font-bold uppercase">{food.brand}</p>
                      <p className="font-bold text-gray-900 mb-1">{food.name}</p>
                      <div className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mb-4 ${
                        food.overall_score >= 75 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      }`}>{Math.round(food.overall_score)} puan</div>
                      <div className="space-y-2.5 text-sm">
                        {[
                          ["Günlük Miktar", calcDaily(food) ? `${calcDaily(food)} g` : "—"],
                          ["Günlük Maliyet", calcCost(food) ? `${calcCost(food)} ₺` : "—"],
                          ["Aylık Maliyet", calcCost(food) ? `${(parseFloat(calcCost(food)!)*30).toFixed(0)} ₺` : "—"],
                          ["Kalori/100g", `${food.calories_kcal} kcal`],
                          ["Protein/100g", `${food.protein_g} g`],
                          ["Yağ/100g", `${food.fat_g} g`],
                          ["Fiyat", food.price_per_kg ? `${food.price_per_kg} ₺/kg` : "—"],
                          ["Alerjen", food.has_allergen ? "⚠️ İçeriyor" : "✅ Yok"],
                        ].map(([k, v]) => (
                          <div key={k} className="flex justify-between border-b border-gray-50 pb-2 last:border-0">
                            <span className="text-gray-400 text-xs">{k}</span>
                            <span className="font-semibold text-gray-900 text-xs">{v}</span>
                          </div>
                        ))}
                      </div>
                      <Link href={`/subscription/new?petId=${petId}`}
                        className="mt-4 block text-center py-2 bg-amber-400 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition">
                        Bu Mamayı Seç
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mama Listesi */}
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {displayed.map((food: any) => {
                  const isExpanded = expandedId === food.id;
                  const isCompared = compareIds.includes(food.id);
                  const isActive = food.id === activeFood?.product_id;
                  const dailyG = calcDaily(food);
                  const dailyCost = calcCost(food);

                  return (
                    <div key={food.id}
                      className={`bg-white rounded-2xl border-2 transition-all overflow-hidden ${
                        isActive ? "border-amber-300" :
                        isCompared ? "border-indigo-300" :
                        food.has_allergen ? "border-red-100" : "border-gray-100"
                      }`}>
                      {/* Kart Başlık — her zaman görünür */}
                      <button className="w-full text-left px-5 py-4" onClick={() => setExpandedId(isExpanded ? null : food.id)}>
                        <div className="flex items-center gap-4">
                          {/* Skor badge */}
                          <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${
                            food.overall_score >= 75 ? "bg-green-100" :
                            food.overall_score >= 50 ? "bg-amber-100" : "bg-red-100"
                          }`}>
                            <span className={`text-base font-black leading-none ${
                              food.overall_score >= 75 ? "text-green-700" :
                              food.overall_score >= 50 ? "text-amber-700" : "text-red-700"
                            }`}>{Math.round(food.overall_score)}</span>
                            <span className="text-[9px] text-gray-400 leading-none">puan</span>
                          </div>

                          {/* İsim + marka */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              {isActive && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">✅ Aktif</span>}
                              {food.has_allergen && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">⚠️ Alerjen</span>}
                              {food.is_verified && <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">✓</span>}
                            </div>
                            <p className="text-xs text-gray-400 font-semibold">{food.brand}</p>
                            <p className="font-bold text-gray-900 truncate">{food.name}</p>
                          </div>

                          {/* Sağ taraf — özet */}
                          <div className="text-right flex-shrink-0 hidden sm:block">
                            {dailyG && <p className="text-sm font-bold text-gray-900">{dailyG}g<span className="text-xs font-normal text-gray-400">/gün</span></p>}
                            {dailyCost && <p className="text-xs text-amber-600 font-semibold">{dailyCost} ₺/gün</p>}
                            {food.price_per_kg && <p className="text-xs text-gray-400">{food.price_per_kg} ₺/kg</p>}
                          </div>

                          <span className={`text-gray-300 flex-shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`}>›</span>
                        </div>

                        {/* Mini barlar */}
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <MiniBar label="Kalori" pct={food.calorie_coverage_percent} />
                          <MiniBar label="Protein" pct={food.protein_coverage_percent} />
                        </div>
                      </button>

                      {/* Genişletilmiş İçerik */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                          {/* Detay grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                            <StatBox label="Günlük" value={dailyG ? `${dailyG} g` : "—"} sub="porsiyon" />
                            <StatBox label="Günlük Maliyet" value={dailyCost ? `${dailyCost} ₺` : "—"} sub="" />
                            <StatBox label="Haftalık" value={dailyG ? `${dailyG * 7} g` : "—"} sub={dailyCost ? `${(parseFloat(dailyCost)*7).toFixed(0)} ₺` : ""} />
                            <StatBox label="Aylık" value={dailyG ? `${dailyG * 30} g` : "—"} sub={dailyCost ? `${(parseFloat(dailyCost)*30).toFixed(0)} ₺` : ""} />
                          </div>

                          {/* Besin değerleri */}
                          <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                            {[
                              ["🔥 Kalori", `${food.calories_kcal} kcal`],
                              ["💪 Protein", `${food.protein_g} g`],
                              ["🫙 Yağ", `${food.fat_g} g`],
                            ].map(([k, v]) => (
                              <div key={k} className="bg-white rounded-xl p-2.5 border border-gray-100">
                                <p className="text-xs text-gray-400">{k}</p>
                                <p className="font-bold text-gray-900 text-sm">{v}<span className="text-[10px] text-gray-400 font-normal">/100g</span></p>
                              </div>
                            ))}
                          </div>

                          {/* İçerik */}
                          {food.ingredients && (
                            <p className="text-xs text-gray-400 mb-4 bg-white rounded-xl p-3 border border-gray-100">
                              <span className="font-semibold text-gray-600">İçerik: </span>{food.ingredients}
                            </p>
                          )}

                          {/* Butonlar */}
                          <div className="flex gap-2">
                            <button onClick={() => toggleCompare(food.id)}
                              className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition ${
                                isCompared ? "bg-indigo-500 text-white border-indigo-500" : "border-gray-200 text-gray-600 hover:border-indigo-300"
                              }`}>
                              {isCompared ? "✓ Karşılaştırmada" : "⚖️ Karşılaştır"}
                            </button>
                            {!isActive ? (
                              <Link href={`/subscription/new?petId=${petId}`}
                                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-amber-400 hover:bg-amber-500 text-white transition text-center">
                                Bu Mamayı Seç
                              </Link>
                            ) : (
                              <div className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-gray-100 text-gray-400 text-center">
                                Zaten Kullanılıyor
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}

function MiniBar({ label, pct }: { label: string; pct: number }) {
  const c = Math.min(pct, 120);
  const color = pct >= 80 ? "bg-green-400" : "bg-amber-400";
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-gray-400 w-12 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${(c/120)*100}%` }} />
      </div>
      <span className="text-[10px] text-gray-400 w-7 text-right">{Math.round(pct)}%</span>
    </div>
  );
}

function StatBox({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-white rounded-xl p-3 text-center border border-gray-100">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="font-bold text-gray-900 text-sm">{value}</p>
      {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
    </div>
  );
}
