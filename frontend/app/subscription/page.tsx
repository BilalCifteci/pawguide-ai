"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { subscriptionsApi } from "@/lib/api";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";

export default function SubscriptionsPage() {
  const { status } = useSession();
  if (status === "unauthenticated") redirect("/auth/login");

  const { data: subs = [], isLoading } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: () => subscriptionsApi.list().then((r) => r.data),
  });

  return (
    <AppLayout>
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Akıllı Abonelik</h1>
            <p className="text-gray-500 text-sm mt-1">
              Mama stok tahmini ve otomatik yeniden sipariş
            </p>
          </div>
        </div>

        {isLoading ? (
          <p className="text-gray-400">Yükleniyor...</p>
        ) : subs.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📦</div>
            <h2 className="text-lg font-semibold text-gray-800">Aktif abonelik yok</h2>
            <p className="text-gray-500 text-sm mt-1">
              Evcil hayvanınız için mama aboneliği oluşturun.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {subs.map((sub: any) => (
              <SubscriptionCard key={sub.id} sub={sub} />
            ))}
          </div>
        )}
      </div>
    </div>
    </AppLayout>
  );
}

function SubscriptionCard({ sub }: { sub: any }) {
  const queryClient = useQueryClient();

  const pauseMutation = useMutation({
    mutationFn: () => subscriptionsApi.pause(sub.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subscriptions"] }),
  });

  const resumeMutation = useMutation({
    mutationFn: () => subscriptionsApi.resume(sub.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subscriptions"] }),
  });

  const daysLeft = sub.days_until_empty;
  const isLow = daysLeft !== null && daysLeft <= sub.reorder_threshold_days;
  const statusColor =
    sub.status === "active"
      ? "bg-green-100 text-green-700"
      : sub.status === "paused"
      ? "bg-amber-100 text-amber-700"
      : "bg-gray-100 text-gray-600";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor}`}>
              {sub.status === "active" ? "Aktif" : sub.status === "paused" ? "Duraklat." : "İptal"}
            </span>
            {isLow && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                ⚠️ Stok azalıyor
              </span>
            )}
          </div>
          <h3 className="font-semibold text-gray-900">Abonelik #{sub.id.slice(0, 8)}</h3>
          <p className="text-sm text-gray-500 mt-1">Stok: {sub.current_stock_g}g</p>
          {sub.predicted_daily_consumption_g && (
            <p className="text-sm text-gray-500">
              Tahmini tüketim: {sub.predicted_daily_consumption_g}g / gün
            </p>
          )}
          {daysLeft !== null && (
            <p className={`text-sm font-medium mt-1 ${isLow ? "text-red-600" : "text-gray-700"}`}>
              Tahmini süre: {Math.round(daysLeft)} gün
            </p>
          )}
        </div>

        <div className="flex gap-2">
          {sub.status === "active" && (
            <button
              onClick={() => pauseMutation.mutate()}
              disabled={pauseMutation.isPending}
              className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Duraklat
            </button>
          )}
          {sub.status === "paused" && (
            <button
              onClick={() => resumeMutation.mutate()}
              disabled={resumeMutation.isPending}
              className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              Devam Et
            </button>
          )}
        </div>
      </div>

      {/* Stock bar */}
      {daysLeft !== null && sub.predicted_daily_consumption_g && (
        <div className="mt-4">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isLow ? "bg-red-400" : "bg-indigo-400"}`}
              style={{
                width: `${Math.min(100, (daysLeft / 30) * 100)}%`,
              }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">30 günlük baz</p>
        </div>
      )}
    </div>
  );
}
