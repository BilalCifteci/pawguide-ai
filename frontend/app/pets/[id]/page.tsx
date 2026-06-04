"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { petsApi, nutritionApi, analyticsApi, subscriptionsApi, healthRecordsApi } from "@/lib/api";
import { WeightChart } from "@/components/WeightChart";
import { AlertBanner } from "@/components/AlertBanner";
import { DietCard } from "@/components/DietCard";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import Link from "next/link";
import { getBreedLabel, getActivityLabel } from "@/lib/petLabels";

const TABS = [
  { key: "genel",    label: "Genel",    icon: "📊" },
  { key: "mama",     label: "Mama",     icon: "🍽️" },
  { key: "diyet",    label: "Diyet",    icon: "⚖️" },
  { key: "saglik",   label: "Sağlık",   icon: "💉" },
  { key: "bilgiler", label: "Bilgiler", icon: "📋" },
];

export default function PetDetailPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  if (status === "unauthenticated") redirect("/auth/login");

  const petId = params.id;
  const [activeTab, setActiveTab] = useState("genel");

  const { data: pet, isLoading } = useQuery({
    queryKey: ["pet", petId],
    queryFn: () => petsApi.get(petId).then(r => r.data),
  });

  const { data: activeFood } = useQuery({
    queryKey: ["active-food", petId],
    queryFn: () => subscriptionsApi.getActiveFood(petId).then(r => r.data),
    enabled: !!pet,
  });

  const { data: alerts = [] } = useQuery<any[]>({
    queryKey: ["health-alerts", petId],
    queryFn: () => analyticsApi.getHealthAlerts(petId).then(r => r.data),
    enabled: !!pet,
  });

  if (isLoading) return (
    <AppLayout backHref="/dashboard" backLabel="Dashboard">
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    </AppLayout>
  );

  if (!pet) return null;

  const emoji = pet.species === "dog" ? "🐕" : "🐈";
  const breedLabel = getBreedLabel(pet.breed) || (pet.species === "dog" ? "Köpek" : "Kedi");

  return (
    <AppLayout backHref="/dashboard" backLabel="Dashboard">
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* ── Profil Başlığı ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
          {/* Üst şerit */}
          <div className="h-3 bg-gradient-to-r from-amber-400 to-orange-500" />
          <div className="p-5">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-4xl flex-shrink-0 shadow-sm">
                {emoji}
              </div>

              {/* İsim + özet bilgiler */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-gray-900">{pet.name}</h1>
                  {pet.is_neutered && <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-medium">Kısır</span>}
                  {alerts.length > 0 && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">⚠️ {alerts.length} Uyarı</span>}
                </div>
                {/* Mini stat şeridi */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                  <span>🐾 {breedLabel}</span>
                  <span>⚖️ {pet.weight_kg} kg</span>
                  <span>{pet.sex === "male" ? "♂ Erkek" : "♀ Dişi"}</span>
                  <span>🏃 {getActivityLabel(pet.activity_level)}</span>
                  {pet.known_allergies && <span className="text-red-500">🚫 {pet.known_allergies}</span>}
                </div>
              </div>

              {/* Düzenle */}
              <Link href={`/pets/${petId}/edit`}
                className="flex-shrink-0 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-semibold transition">
                ✏️
              </Link>
            </div>

            {/* Aktif mama özeti */}
            {activeFood && (
              <div className="mt-3 flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                <span className="text-lg">🥘</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400">Aktif Mama</p>
                  <p className="text-sm font-bold text-gray-900 truncate">{activeFood.brand} — {activeFood.name}</p>
                </div>
                {activeFood.daily_amount_g && (
                  <span className="text-xs text-amber-700 font-semibold flex-shrink-0">{activeFood.daily_amount_g}g/gün</span>
                )}
              </div>
            )}
          </div>

          {/* ── Tab Çubuğu ── */}
          <div className="border-t border-gray-100 flex overflow-x-auto">
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition flex-1 justify-center ${
                  activeTab === tab.key
                    ? "border-amber-400 text-amber-600 bg-amber-50/50"
                    : "border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                }`}>
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab İçerikleri ── */}

        {/* GENEL */}
        {activeTab === "genel" && (
          <div className="space-y-4">
            {alerts.map((a: any, i: number) => <AlertBanner key={i} alert={a} />)}
            <WeightChart petId={petId} />
            <WeightLogForm petId={petId} currentWeight={pet.weight_kg} />
          </div>
        )}

        {/* MAMA */}
        {activeTab === "mama" && (
          <div className="space-y-4">
            {activeFood ? (
              <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4 border-b border-amber-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-amber-600 font-bold uppercase tracking-wide">✅ Aktif Abonelik Maması</p>
                    <h2 className="font-bold text-gray-900 text-lg mt-0.5">{activeFood.brand} — {activeFood.name}</h2>
                  </div>
                  <span className="text-xs bg-amber-200 text-amber-800 px-2.5 py-1 rounded-full font-bold flex-shrink-0">
                    {activeFood.frequency === "monthly" ? "Aylık" : "Haftalık"}
                  </span>
                </div>
                <div className="p-5 grid grid-cols-3 gap-3">
                  <InfoBox icon="🍽️" label="Günlük Porsiyon" value={activeFood.daily_amount_g ? `${activeFood.daily_amount_g} g` : "—"} />
                  <InfoBox icon="💰" label="Günlük Maliyet" value={activeFood.daily_amount_g && activeFood.price_per_kg ? `${((activeFood.daily_amount_g/1000)*activeFood.price_per_kg).toFixed(2)} ₺` : "—"} />
                  <InfoBox icon="📅" label="Aylık Maliyet" value={activeFood.daily_amount_g && activeFood.price_per_kg ? `${((activeFood.daily_amount_g/1000)*activeFood.price_per_kg*30).toFixed(0)} ₺` : "—"} />
                </div>
                {activeFood.allergens && (
                  <div className="px-5 pb-4">
                    <p className="text-xs text-gray-400">İçerik: <span className="font-medium text-gray-600">{activeFood.allergens}</span></p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center">
                <div className="text-4xl mb-3">🔍</div>
                <p className="font-semibold text-gray-700">Henüz mama seçilmedi</p>
                <p className="text-sm text-gray-400 mt-1">Hayvanınız için en uygun mamayı bulalım</p>
              </div>
            )}
            <Link href={`/pets/${petId}/food`}
              className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-amber-300 transition group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-xl">🍽️</div>
                <div>
                  <p className="font-bold text-gray-900">Tüm Mamalar</p>
                  <p className="text-xs text-gray-400">Karşılaştır, puanla ve seç</p>
                </div>
              </div>
              <span className="text-gray-300 group-hover:text-amber-400 transition text-lg">→</span>
            </Link>
            <NutritionPanel petId={petId} />
          </div>
        )}

        {/* DİYET */}
        {activeTab === "diyet" && (
          <DietCard petId={petId} petName={pet.name} />
        )}

        {/* SAĞLIK */}
        {activeTab === "saglik" && (
          <HealthTab petId={petId} />
        )}

        {/* BİLGİLER */}
        {activeTab === "bilgiler" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h2 className="font-bold text-gray-900 mb-4">Profil Bilgileri</h2>
            {[
              { label: "İsim", value: pet.name },
              { label: "Tür", value: pet.species === "dog" ? "Köpek" : "Kedi" },
              { label: "Irk", value: breedLabel },
              { label: "Cinsiyet", value: pet.sex === "male" ? "Erkek" : "Dişi" },
              { label: "Ağırlık", value: `${pet.weight_kg} kg` },
              { label: "Aktivite", value: getActivityLabel(pet.activity_level) },
              { label: "Kısırlaştırıldı", value: pet.is_neutered ? "Evet" : "Hayır" },
              { label: "Alerjiler", value: pet.known_allergies || "—" },
              { label: "Tıbbi Notlar", value: pet.medical_conditions || "—" },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-400">{row.label}</span>
                <span className="text-sm font-semibold text-gray-900">{row.value}</span>
              </div>
            ))}
            <div className="pt-2 flex gap-2">
              <Link href={`/pets/${petId}/edit`}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold text-center transition">
                ✏️ Düzenle
              </Link>
              <Link href={`/pets/${petId}/health`}
                className="flex-1 py-2.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl text-sm font-bold text-center transition">
                💉 Sağlık Kaydı
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// ── Alt Bileşenler ──

function WeightLogForm({ petId, currentWeight }: { petId: string; currentWeight: number }) {
  const [weight, setWeight] = useState("");
  const [calorie, setCalorie] = useState("");
  const [msg, setMsg] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => petsApi.logWeight(petId, {
      weight_kg: parseFloat(weight),
      calorie_intake: calorie ? parseFloat(calorie) : undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weight-logs", petId] });
      queryClient.invalidateQueries({ queryKey: ["diet", petId] });
      queryClient.invalidateQueries({ queryKey: ["pet", petId] });
      setWeight(""); setCalorie("");
      setMsg("Kaydedildi!"); setTimeout(() => setMsg(""), 3000);
    },
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><span>⚖️</span> Ağırlık Kaydet</h2>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Ağırlık (kg)</label>
          <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)}
            placeholder={`${currentWeight}`}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Kalori (kcal)</label>
          <input type="number" value={calorie} onChange={e => setCalorie(e.target.value)}
            placeholder="Opsiyonel"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50" />
        </div>
      </div>
      {msg && <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-xl mb-3">✅ {msg}</p>}
      <button onClick={() => mutation.mutate()} disabled={!weight || mutation.isPending}
        className="w-full py-2.5 bg-amber-400 hover:bg-amber-500 text-white rounded-xl text-sm font-bold transition disabled:opacity-50">
        {mutation.isPending ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </div>
  );
}

function NutritionPanel({ petId }: { petId: string }) {
  const { data: req } = useQuery({
    queryKey: ["nutrition-requirements", petId],
    queryFn: () => nutritionApi.getRequirements(petId).then(r => r.data),
  });
  if (!req) return null;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><span>🥗</span> Günlük Beslenme İhtiyacı</h2>
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: "🔥", label: "Kalori", value: `${req.daily_calories_kcal} kcal` },
          { icon: "💪", label: "Protein", value: `${req.daily_protein_g} g` },
          { icon: "🫙", label: "Yağ", value: `${req.daily_fat_g} g` },
          { icon: "🥬", label: "Lif", value: `${req.daily_fiber_g} g` },
          { icon: "🍽️", label: "Öğün/Gün", value: `${req.feeding_frequency}x` },
          req.daily_carbs_g !== null && { icon: "🌾", label: "Karbonhidrat", value: `${req.daily_carbs_g} g` },
        ].filter(Boolean).map((item: any) => (
          <div key={item.label} className="bg-gray-50 rounded-xl p-3 flex items-center gap-2">
            <span className="text-lg">{item.icon}</span>
            <div>
              <p className="text-xs text-gray-400">{item.label}</p>
              <p className="font-bold text-gray-900 text-sm">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-300 mt-3 text-center">FEDIAF 2021 standartlarına göre</p>
    </div>
  );
}

function HealthTab({ petId }: { petId: string }) {
  const queryClient = useQueryClient();
  const { data: records = [], isLoading } = useQuery<any[]>({
    queryKey: ["health-records", petId],
    queryFn: () => healthRecordsApi.list(petId).then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => healthRecordsApi.delete(petId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["health-records", petId] }),
  });

  const TYPE_LABELS: Record<string, string> = {
    vaccination: "💉 Aşı", vet_visit: "🏥 Vet", medication: "💊 İlaç",
    surgery: "🔪 Ameliyat", lab_test: "🧪 Tahlil", other: "📋 Diğer",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-900">Sağlık Kayıtları</h2>
        <Link href={`/pets/${petId}/health`}
          className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-white rounded-xl text-sm font-bold transition">
          + Kayıt Ekle
        </Link>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
          <div className="text-4xl mb-2">📋</div>
          <p className="text-gray-500 font-semibold">Henüz kayıt yok</p>
          <Link href={`/pets/${petId}/health`} className="text-sm text-amber-500 mt-1 block">İlk kaydı ekle →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((r: any) => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-3">
              <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-medium flex-shrink-0">
                {TYPE_LABELS[r.record_type] ?? r.record_type}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{r.title}</p>
                <div className="flex gap-3 mt-0.5 text-xs text-gray-400 flex-wrap">
                  {r.record_date && <span>📅 {r.record_date}</span>}
                  {r.vet_name && <span>👨‍⚕️ {r.vet_name}</span>}
                  {r.next_due_date && <span className="text-amber-600 font-medium">🔔 {r.next_due_date}</span>}
                </div>
              </div>
              <button onClick={() => deleteMutation.mutate(r.id)}
                className="text-gray-300 hover:text-red-400 transition p-1 flex-shrink-0">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoBox({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-white border border-amber-100 rounded-xl p-3 text-center shadow-sm">
      <div className="text-xl mb-1">{icon}</div>
      <p className="font-bold text-gray-900 text-sm">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}
