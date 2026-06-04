"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { petsApi, nutritionApi, subscriptionsApi } from "@/lib/api";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";

type Frequency = "weekly" | "monthly";

export default function NewSubscriptionPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>}>
      <NewSubscriptionContent />
    </Suspense>
  );
}

function NewSubscriptionContent() {
  const { data: session, status } = useSession();
  if (status === "unauthenticated") redirect("/auth/login");

  const router = useRouter();
  const searchParams = useSearchParams();
  const petId = searchParams.get("petId");

  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [address, setAddress] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const { data: pet } = useQuery({
    queryKey: ["pet", petId],
    queryFn: () => petsApi.get(petId!).then((r) => r.data),
    enabled: !!petId,
  });

  const { data: recommendations = [], isLoading: recLoading } = useQuery<any[]>({
    queryKey: ["recommendations", petId],
    queryFn: () => nutritionApi.getRecommendations(petId!).then((r) => r.data),
    enabled: !!petId,
  });

  const { data: estimate, isLoading: estLoading } = useQuery({
    queryKey: ["estimate", petId, selectedFood?.id],
    queryFn: () => nutritionApi.getEstimate(petId!, selectedFood!.id).then((r) => r.data),
    enabled: !!petId && !!selectedFood,
  });

  const safeFoods = recommendations.filter((r: any) => !r.has_allergen);
  const topFoods = safeFoods.slice(0, 6);

  const createMutation = useMutation({
    mutationFn: () =>
      subscriptionsApi.create({
        pet_id: petId,
        product_id: selectedFood.id,
        current_stock_g: frequency === "monthly" ? (estimate?.monthly_amount_g ?? 0) : (estimate?.weekly_amount_g ?? 0),
        delivery_address: address || "Belirtilmedi",
        frequency,
        daily_amount_g: estimate?.daily_amount_g,
        price_per_kg: estimate?.price_per_kg,
      }),
    onSuccess: () => {
      router.push("/subscription");
    },
  });

  const periodAmount = frequency === "monthly" ? estimate?.monthly_amount_g : estimate?.weekly_amount_g;
  const periodCost = frequency === "monthly" ? estimate?.monthly_cost_tl : estimate?.weekly_cost_tl;
  const periodLabel = frequency === "monthly" ? "Aylik" : "Haftalik";

  if (!petId) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-400">Hayvan bulunamadi.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-50 text-3xl mb-4">
            🎉
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {pet ? `${pet.name} icin Abonelik Kur!` : "Abonelik Kur"}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Duzzenli teslimat ile mama hic bitmesin
          </p>
        </div>

        {/* Pet summary */}
        {pet && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-100 p-4 mb-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-2xl">
              {pet.species === "dog" ? "🐕" : "🐈"}
            </div>
            <div>
              <p className="font-bold text-gray-900">{pet.name}</p>
              <p className="text-sm text-gray-500">{pet.weight_kg} kg · {pet.species === "dog" ? "Kopek" : "Kedi"}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-gray-400">Gunluk ihtiyac</p>
              <p className="font-bold text-amber-600">{pet.weight_kg * 30} g / gun</p>
            </div>
          </div>
        )}

        {/* Progress steps */}
        <div className="flex items-center gap-2 mb-8">
          {[
            { n: 1, label: "Mama Sec" },
            { n: 2, label: "Sikligi Ayarla" },
            { n: 3, label: "Onayla" },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step >= s.n ? "bg-amber-400 text-white" : "bg-gray-100 text-gray-400"
              }`}>
                {step > s.n ? "✓" : s.n}
              </div>
              <span className={`text-xs font-medium ${step >= s.n ? "text-gray-700" : "text-gray-400"}`}>{s.label}</span>
              {i < 2 && <div className={`flex-1 h-0.5 ${step > s.n ? "bg-amber-400" : "bg-gray-100"}`} />}
            </div>
          ))}
        </div>

        {/* STEP 1: Mama sec */}
        {step === 1 && (
          <div>
            <h2 className="font-bold text-gray-900 mb-4">
              {pet?.name} icin mama sec
              {pet?.known_allergies && (
                <span className="ml-2 text-xs font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  ⚠️ Alerjen filtresi aktif
                </span>
              )}
            </h2>

            {recLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {topFoods.map((food: any) => {
                  const isSelected = selectedFood?.id === food.id;
                  return (
                    <button
                      key={food.id}
                      onClick={() => setSelectedFood(food)}
                      className={`text-left rounded-2xl border-2 p-4 transition-all ${
                        isSelected
                          ? "border-amber-400 bg-amber-50"
                          : "border-gray-100 bg-white hover:border-amber-200 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{food.brand}</p>
                          <p className="font-bold text-gray-900 text-sm mt-0.5">{food.name}</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected ? "border-amber-400 bg-amber-400" : "border-gray-200"
                        }`}>
                          {isSelected && <span className="text-white text-xs">✓</span>}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <div className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            food.overall_score >= 75 ? "bg-green-100 text-green-700" :
                            food.overall_score >= 50 ? "bg-amber-100 text-amber-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {Math.round(food.overall_score)} puan
                          </div>
                        </div>
                        {food.price_per_kg && (
                          <p className="text-sm font-bold text-gray-700">
                            {food.price_per_kg} <span className="text-xs font-normal text-gray-400">TL/kg</span>
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex justify-between mt-6">
              <button
                onClick={() => router.push(`/pets/${petId}`)}
                className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition"
            >
                Simdilik gecin
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!selectedFood}
                className="px-6 py-2.5 bg-amber-400 hover:bg-amber-500 text-white rounded-xl text-sm font-bold disabled:opacity-40 transition shadow-sm shadow-amber-200"
              >
                Devam →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Siklik */}
        {step === 2 && (
          <div>
            <h2 className="font-bold text-gray-900 mb-2">Teslimat sikligi</h2>
            <p className="text-sm text-gray-400 mb-6">
              {pet?.name} icin ne siklikla mama gonderelim?
            </p>

            {/* Frequency toggle */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {(["weekly", "monthly"] as Frequency[]).map((f) => {
                const isActive = frequency === f;
                const label = f === "weekly" ? "Haftalik" : "Aylik";
                const sub = f === "weekly" ? "Her 7 gunce" : "Her 30 gunce";
                const discount = f === "monthly" ? "% 10 indirim" : null;
                return (
                  <button
                    key={f}
                    onClick={() => setFrequency(f)}
                    className={`relative rounded-2xl border-2 p-5 text-left transition-all ${
                      isActive ? "border-amber-400 bg-amber-50" : "border-gray-100 bg-white hover:border-amber-200"
                    }`}
                  >
                    {discount && (
                      <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {discount}
                      </span>
                    )}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg mb-3 ${
                      isActive ? "bg-amber-400" : "bg-gray-100"
                    }`}>
                      {f === "weekly" ? "📅" : "🗓️"}
                    </div>
                    <p className="font-bold text-gray-900">{label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                  </button>
                );
              })}
            </div>

            {/* Cost estimate */}
            {estLoading ? (
              <div className="bg-gray-50 rounded-2xl p-5 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : estimate && (
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white mb-6">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-4">
                  {periodLabel} Hesaplama
                </p>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <CostItem label="Gunluk" amount={`${estimate.daily_amount_g}g`} cost={`${estimate.daily_cost_tl} TL`} />
                  <CostItem label="Haftalik" amount={`${estimate.weekly_amount_g}g`} cost={`${estimate.weekly_cost_tl} TL`} highlight={frequency === "weekly"} />
                  <CostItem label="Aylik" amount={`${estimate.monthly_amount_g}g`} cost={`${estimate.monthly_cost_tl} TL`} highlight={frequency === "monthly"} />
                </div>
                <div className="border-t border-slate-700 pt-4 flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-xs">Secilen: {selectedFood?.brand} {selectedFood?.name}</p>
                    <p className="text-slate-400 text-xs mt-0.5">Birim fiyat: {estimate.price_per_kg} TL/kg</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-amber-400">{periodCost} TL</p>
                    <p className="text-xs text-slate-400">{periodLabel.toLowerCase()} toplam</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition">
                ← Geri
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-6 py-2.5 bg-amber-400 hover:bg-amber-500 text-white rounded-xl text-sm font-bold transition shadow-sm shadow-amber-200"
              >
                Devam →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Onayla */}
        {step === 3 && (
          <div>
            <h2 className="font-bold text-gray-900 mb-2">Aboneligi onayla</h2>
            <p className="text-sm text-gray-400 mb-6">Her seyi kontrol edin ve onayla</p>

            {/* Summary card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
              <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-4">
                <p className="text-white/80 text-xs font-semibold uppercase tracking-wider">Abonelik Ozeti</p>
              </div>
              <div className="p-5 space-y-3">
                <SummaryRow label="Hayvan" value={`${pet?.name} (${pet?.weight_kg} kg)`} />
                <SummaryRow label="Mama" value={`${selectedFood?.brand} - ${selectedFood?.name}`} />
                <SummaryRow label="Siklik" value={frequency === "monthly" ? "Aylik" : "Haftalik"} />
                <SummaryRow label="Miktar" value={`${periodAmount}g / ${frequency === "monthly" ? "ay" : "hafta"}`} />
                <div className="border-t border-gray-50 pt-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Toplam Tutar</span>
                  <span className="text-xl font-bold text-amber-500">{periodCost} TL</span>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                Teslimat Adresi (opsiyonel)
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                placeholder="Adres girmek isterseniz buraya yazabilirsiniz..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-gray-50 resize-none"
              />
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition">
                ← Geri
              </button>
              <button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending}
                className="px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white rounded-xl text-sm font-bold transition shadow-sm shadow-amber-200 hover:shadow-md disabled:opacity-50"
              >
                {createMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Olusturuluyor...
                  </span>
                ) : "🎉 Aboneligi Baslat"}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function CostItem({ label, amount, cost, highlight }: { label: string; amount: string; cost: string; highlight?: boolean }) {
  return (
    <div className={`text-center p-3 rounded-xl ${highlight ? "bg-amber-400/20 ring-1 ring-amber-400/40" : "bg-slate-700/50"}`}>
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-sm font-bold text-white">{amount}</p>
      <p className={`text-xs mt-0.5 font-semibold ${highlight ? "text-amber-400" : "text-slate-300"}`}>{cost}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm font-semibold text-gray-900 text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}
