"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { subscriptionsApi, petsApi } from "@/lib/api";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import Link from "next/link";

export default function SubscriptionsPage() {
  const { data: session, status } = useSession();
  if (status === "unauthenticated") redirect("/auth/login");

  const { data: subs = [], isLoading } = useQuery<any[]>({
    queryKey: ["subscriptions"],
    queryFn: () => subscriptionsApi.list().then((r) => r.data),
  });

  const { data: pets = [] } = useQuery<any[]>({
    queryKey: ["pets"],
    queryFn: () => petsApi.list().then((r) => r.data),
    enabled: !!session,
  });

  const getPet = (petId: string) => pets.find((p: any) => p.id === petId);

  const activeSubs = subs.filter((s: any) => s.status === "active");
  const totalMonthly = activeSubs.reduce((sum: number, s: any) => {
    if (!s.daily_amount_g || !s.price_per_kg) return sum;
    return sum + (s.daily_amount_g * 30 / 1000) * s.price_per_kg;
  }, 0);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Aboneliklerim</h1>
            <p className="text-gray-400 text-sm mt-1">Mama teslimat planlariniz</p>
          </div>
          <Link
            href="/pets/new"
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-white rounded-xl text-sm font-bold shadow-sm shadow-amber-200 transition flex-shrink-0"
          >
            + Yeni Abonelik
          </Link>
        </div>

        {/* Summary bar */}
        {activeSubs.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-400 mb-1">Aktif Abonelik</p>
              <p className="text-2xl font-bold text-gray-900">{activeSubs.length}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-400 mb-1">Aylik Toplam</p>
              <p className="text-2xl font-bold text-amber-500">{totalMonthly.toFixed(0)} TL</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-400 mb-1">Gunluk Ortalama</p>
              <p className="text-2xl font-bold text-gray-900">{(totalMonthly / 30).toFixed(1)} TL</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : subs.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {subs.map((sub: any) => (
              <SubscriptionCard key={sub.id} sub={sub} pet={getPet(sub.pet_id)} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function SubscriptionCard({ sub, pet }: { sub: any; pet: any }) {
  const queryClient = useQueryClient();

  const pauseMutation = useMutation({
    mutationFn: () => subscriptionsApi.pause(sub.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subscriptions"] }),
  });

  const resumeMutation = useMutation({
    mutationFn: () => subscriptionsApi.resume(sub.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subscriptions"] }),
  });

  const isActive = sub.status === "active";
  const isPaused = sub.status === "paused";
  const freq = sub.frequency === "weekly" ? "Haftalik" : "Aylik";
  const days = sub.frequency === "weekly" ? 7 : 30;
  const periodAmount = sub.daily_amount_g ? (sub.daily_amount_g * days).toFixed(0) : null;
  const periodCost = sub.daily_amount_g && sub.price_per_kg
    ? ((sub.daily_amount_g * days / 1000) * sub.price_per_kg).toFixed(2)
    : null;
  const dailyCost = sub.daily_amount_g && sub.price_per_kg
    ? ((sub.daily_amount_g / 1000) * sub.price_per_kg).toFixed(2)
    : null;

  const daysLeft = sub.days_until_empty;
  const isLow = daysLeft !== null && daysLeft <= sub.reorder_threshold_days;

  const stockPercent = daysLeft !== null ? Math.min(100, (daysLeft / days) * 100) : null;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${isLow ? "border-red-200" : "border-gray-100"}`}>
      {/* Top strip */}
      <div className={`h-1 ${isActive ? "bg-gradient-to-r from-amber-400 to-orange-500" : "bg-gray-200"}`} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            {/* Pet avatar */}
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-xl">
              {pet?.species === "dog" ? "🐕" : "🐈"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-gray-900">{pet?.name ?? "Hayvan"}</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  isActive ? "bg-green-100 text-green-700" :
                  isPaused ? "bg-amber-100 text-amber-700" :
                  "bg-gray-100 text-gray-500"
                }`}>
                  {isActive ? "Aktif" : isPaused ? "Durduruldu" : "Iptal"}
                </span>
                {isLow && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                    ⚠️ Stok az
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">#{sub.id.slice(0, 8)} · {freq} teslimat</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-shrink-0">
            {isActive && (
              <button
                onClick={() => pauseMutation.mutate()}
                disabled={pauseMutation.isPending}
                className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
              >
                Durdur
              </button>
            )}
            {isPaused && (
              <button
                onClick={() => resumeMutation.mutate()}
                disabled={resumeMutation.isPending}
                className="px-3 py-1.5 text-xs font-semibold bg-amber-400 text-white rounded-xl hover:bg-amber-500 transition disabled:opacity-50"
              >
                Devam Et
              </button>
            )}
          </div>
        </div>

        {/* Cost breakdown */}
        {dailyCost && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Gunluk</p>
              <p className="text-sm font-bold text-gray-900">{sub.daily_amount_g}g</p>
              <p className="text-xs text-amber-600 font-semibold mt-0.5">{dailyCost} TL</p>
            </div>
            <div className={`rounded-xl p-3 text-center ${sub.frequency === "weekly" ? "bg-amber-50 ring-1 ring-amber-200" : "bg-gray-50"}`}>
              <p className="text-xs text-gray-400 mb-1">Haftalik</p>
              <p className="text-sm font-bold text-gray-900">{(sub.daily_amount_g * 7).toFixed(0)}g</p>
              <p className="text-xs text-amber-600 font-semibold mt-0.5">
                {((sub.daily_amount_g * 7 / 1000) * sub.price_per_kg).toFixed(2)} TL
              </p>
            </div>
            <div className={`rounded-xl p-3 text-center ${sub.frequency === "monthly" ? "bg-amber-50 ring-1 ring-amber-200" : "bg-gray-50"}`}>
              <p className="text-xs text-gray-400 mb-1">Aylik</p>
              <p className="text-sm font-bold text-gray-900">{(sub.daily_amount_g * 30).toFixed(0)}g</p>
              <p className="text-xs text-amber-600 font-semibold mt-0.5">
                {((sub.daily_amount_g * 30 / 1000) * sub.price_per_kg).toFixed(2)} TL
              </p>
            </div>
          </div>
        )}

        {/* Stock bar */}
        {stockPercent !== null && (
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span>Stok durumu</span>
              <span className={isLow ? "text-red-500 font-semibold" : ""}>
                {daysLeft !== null ? `~${Math.round(daysLeft)} gun kaldi` : ""}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isLow ? "bg-red-400" : "bg-gradient-to-r from-amber-400 to-orange-500"}`}
                style={{ width: `${stockPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-3xl bg-amber-50 flex items-center justify-center text-4xl mb-5">
        📦
      </div>
      <h2 className="text-lg font-bold text-gray-800">Aktif abonelik yok</h2>
      <p className="text-gray-400 text-sm mt-2 max-w-xs">
        Hayvaniniz icin mama aboneligi olusturun, duzenli teslimatla mama hic bitmesin.
      </p>
      <Link
        href="/pets/new"
        className="mt-6 px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-white rounded-xl text-sm font-bold shadow-sm shadow-amber-200 transition"
      >
        Abonelik Olustur
      </Link>
    </div>
  );
}
