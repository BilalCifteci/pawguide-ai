"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { petsApi } from "@/lib/api";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";

const BREED_OPTIONS: Record<string, { value: string; label: string }[]> = {
  dog: [
    { value: "golden_retriever", label: "Golden Retriever" },
    { value: "labrador", label: "Labrador" },
    { value: "german_shepherd", label: "Alman Coban Kopegi" },
    { value: "bulldog", label: "Bulldog" },
    { value: "poodle", label: "Kanis" },
    { value: "chihuahua", label: "Chihuahua" },
    { value: "husky", label: "Husky" },
    { value: "beagle", label: "Beagle" },
    { value: "border_collie", label: "Border Collie" },
    { value: "pomeranian", label: "Pomeranian" },
    { value: "maltese", label: "Maltese" },
    { value: "mixed", label: "Melez" },
    { value: "other", label: "Diger" },
  ],
  cat: [
    { value: "tekir", label: "Tekir" },
    { value: "van", label: "Van Kedisi" },
    { value: "angora", label: "Ankara Kedisi" },
    { value: "persian", label: "Iran Kedisi" },
    { value: "british_shorthair", label: "British Shorthair" },
    { value: "scottish_fold", label: "Scottish Fold" },
    { value: "maine_coon", label: "Maine Coon" },
    { value: "siamese", label: "Siyam" },
    { value: "ragdoll", label: "Ragdoll" },
    { value: "bengal", label: "Bengal" },
    { value: "mixed", label: "Melez" },
    { value: "other", label: "Diger" },
  ],
};

const ALLERGY_OPTIONS = [
  { value: "tavuk", label: "🍗 Tavuk" },
  { value: "sigir", label: "🥩 Sigir" },
  { value: "balik", label: "🐟 Balik" },
  { value: "bugday", label: "🌾 Bugday" },
  { value: "sut", label: "🥛 Sut / Laktoz" },
  { value: "yumurta", label: "🥚 Yumurta" },
  { value: "soya", label: "Soya" },
  { value: "misir", label: "🌽 Misir" },
];

const ACTIVITY_OPTIONS = [
  { value: "sedentary", label: "Hareketsiz" },
  { value: "low", label: "Dusuk" },
  { value: "moderate", label: "Orta" },
  { value: "high", label: "Yuksek" },
  { value: "very_high", label: "Cok yuksek" },
];

export default function EditPetPage({ params }: { params: { id: string } }) {
  const { status } = useSession();
  if (status === "unauthenticated") redirect("/auth/login");

  const router = useRouter();
  const queryClient = useQueryClient();
  const petId = params.id;

  const { data: pet, isLoading } = useQuery({
    queryKey: ["pet", petId],
    queryFn: () => petsApi.get(petId).then((r) => r.data),
  });

  const [form, setForm] = useState({
    name: "", weight_kg: "", activity_level: "moderate", is_neutered: false,
    known_allergies: "", breed: "", medical_conditions: "",
  });
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (pet) {
      setForm({
        name: pet.name,
        weight_kg: String(pet.weight_kg),
        activity_level: pet.activity_level,
        is_neutered: pet.is_neutered,
        known_allergies: pet.known_allergies ?? "",
        breed: pet.breed ?? "",
        medical_conditions: pet.medical_conditions ?? "",
      });
      if (pet.known_allergies) {
        setSelectedAllergies(pet.known_allergies.split(",").map((a: string) => a.trim()));
      }
    }
  }, [pet]);

  const mutation = useMutation({
    mutationFn: () =>
      petsApi.update(petId, {
        name: form.name,
        weight_kg: parseFloat(form.weight_kg),
        activity_level: form.activity_level,
        is_neutered: form.is_neutered,
        known_allergies: selectedAllergies.length > 0 ? selectedAllergies.join(", ") : undefined,
        medical_conditions: form.medical_conditions || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pet", petId] });
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      queryClient.invalidateQueries({ queryKey: ["diet", petId] });
      setSuccess(true);
      setTimeout(() => router.push(`/pets/${petId}`), 1200);
    },
    onError: (e: any) => setError(e.message ?? "Bir hata olustu."),
  });

  const deleteMutation = useMutation({
    mutationFn: () => petsApi.delete(petId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      router.push("/dashboard");
    },
  });

  const set = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleAllergy = (value: string) =>
    setSelectedAllergies((prev) => prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value]);

  if (isLoading) return (
    <AppLayout backHref={`/pets/${petId}`} backLabel="Geri">
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    </AppLayout>
  );

  const species = pet?.species ?? "cat";

  return (
    <AppLayout backHref={`/pets/${petId}`} backLabel={pet?.name ?? "Geri"}>
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="text-3xl">{species === "dog" ? "🐕" : "🐈"}</div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Profili Duzenle</h1>
            <p className="text-sm text-gray-400">{pet?.name}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          {/* Name */}
          <Field label="Isim">
            <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)}
              className={inputClass} placeholder="Karamel..." />
          </Field>

          {/* Breed */}
          <Field label="Irk">
            <select value={form.breed} onChange={(e) => set("breed", e.target.value)} className={inputClass}>
              <option value="">— Seciniz —</option>
              {(BREED_OPTIONS[species] ?? []).map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
          </Field>

          {/* Weight */}
          <Field label="Agirlik (kg)">
            <input type="number" step="0.1" value={form.weight_kg} onChange={(e) => set("weight_kg", e.target.value)}
              className={inputClass} placeholder="4.5" />
          </Field>

          {/* Activity */}
          <Field label="Aktivite Seviyesi">
            <select value={form.activity_level} onChange={(e) => set("activity_level", e.target.value)} className={inputClass}>
              {ACTIVITY_OPTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </Field>

          {/* Neutered */}
          <div className="flex items-center gap-3">
            <input type="checkbox" id="neutered" checked={form.is_neutered}
              onChange={(e) => set("is_neutered", e.target.checked)} className="w-4 h-4 accent-amber-500" />
            <label htmlFor="neutered" className="text-sm font-medium text-gray-700">Kisirlestirildi</label>
          </div>

          {/* Allergies */}
          <Field label="Bilinen Alerjiler">
            <div className="flex flex-wrap gap-2 mt-1">
              {ALLERGY_OPTIONS.map((a) => (
                <button key={a.value} type="button" onClick={() => toggleAllergy(a.value)}
                  className={`px-3 py-1.5 rounded-full text-sm border font-medium transition ${
                    selectedAllergies.includes(a.value)
                      ? "bg-red-50 border-red-400 text-red-700"
                      : "bg-gray-50 border-gray-300 text-gray-600 hover:border-gray-400"
                  }`}>
                  {a.label}
                </button>
              ))}
            </div>
          </Field>

          {/* Medical conditions */}
          <Field label="Tibbi Notlar (opsiyonel)">
            <textarea value={form.medical_conditions} onChange={(e) => set("medical_conditions", e.target.value)}
              rows={2} className={`${inputClass} resize-none`} placeholder="Bilinen rahatsizliklar..." />
          </Field>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
          {success && <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-xl">✅ Kaydedildi! Yonlendiriliyor...</p>}

          <button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.name || !form.weight_kg}
            className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white rounded-xl font-bold transition shadow-sm shadow-amber-200 disabled:opacity-50">
            {mutation.isPending ? "Kaydediliyor..." : "Degisiklikleri Kaydet"}
          </button>
        </div>

        {/* Danger zone */}
        <div className="mt-6 bg-white rounded-2xl border border-red-100 p-5">
          <h3 className="text-sm font-bold text-red-600 mb-1">Tehlikeli Bolge</h3>
          <p className="text-xs text-gray-400 mb-3">Bu islem geri alinamaz. Tum veriler silinir.</p>
          <button
            onClick={() => { if (confirm(`${pet?.name} silinsin mi? Bu islem geri alinamaz.`)) deleteMutation.mutate(); }}
            disabled={deleteMutation.isPending}
            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-semibold transition disabled:opacity-50 border border-red-200">
            {deleteMutation.isPending ? "Siliniyor..." : `${pet?.name} Profilini Sil`}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}

const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50 hover:bg-white transition";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}
