"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { petsApi } from "@/lib/api";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";

const SPECIES_OPTIONS = [
  { value: "dog", label: "🐕 Köpek" },
  { value: "cat", label: "🐈 Kedi" },
];

const BREED_OPTIONS: Record<string, { value: string; label: string }[]> = {
  dog: [
    { value: "golden_retriever", label: "Golden Retriever" },
    { value: "labrador", label: "Labrador" },
    { value: "german_shepherd", label: "Alman Çoban Köpeği" },
    { value: "bulldog", label: "Bulldog" },
    { value: "poodle", label: "Kaniş" },
    { value: "chihuahua", label: "Chihuahua" },
    { value: "husky", label: "Husky" },
    { value: "beagle", label: "Beagle" },
    { value: "border_collie", label: "Border Collie" },
    { value: "pomeranian", label: "Pomeranian" },
    { value: "maltese", label: "Maltese" },
    { value: "mixed", label: "Melez" },
    { value: "other", label: "Diğer" },
  ],
  cat: [
    { value: "tekir", label: "Tekir" },
    { value: "van", label: "Van Kedisi" },
    { value: "angora", label: "Ankara Kedisi" },
    { value: "persian", label: "İran Kedisi" },
    { value: "british_shorthair", label: "British Shorthair" },
    { value: "scottish_fold", label: "Scottish Fold" },
    { value: "maine_coon", label: "Maine Coon" },
    { value: "siamese", label: "Siyam" },
    { value: "ragdoll", label: "Ragdoll" },
    { value: "bengal", label: "Bengal" },
    { value: "mixed", label: "Melez" },
    { value: "other", label: "Diğer" },
  ],
};

const ALLERGY_OPTIONS = [
  { value: "tavuk", label: "🍗 Tavuk" },
  { value: "sigir", label: "🥩 Sığır" },
  { value: "balik", label: "🐟 Balık" },
  { value: "bugday", label: "🌾 Buğday" },
  { value: "sut", label: "🥛 Süt / Laktoz" },
  { value: "yumurta", label: "🥚 Yumurta" },
  { value: "soya", label: "Soya" },
  { value: "misir", label: "🌽 Mısır" },
];

const ACTIVITY_OPTIONS = [
  { value: "sedentary", label: "Hareketsiz" },
  { value: "low", label: "Düşük" },
  { value: "moderate", label: "Orta" },
  { value: "high", label: "Yüksek" },
  { value: "very_high", label: "Çok yüksek" },
];

export default function NewPetPage() {
  const { status } = useSession();
  if (status === "unauthenticated") redirect("/auth/login");

  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    species: "dog",
    breed: "",
    sex: "male",
    birth_date: "",
    weight_kg: "",
    activity_level: "moderate",
    is_neutered: false,
    medical_conditions: "",
  });
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      petsApi.create({
        ...form,
        weight_kg: parseFloat(form.weight_kg),
        birth_date: form.birth_date || undefined,
        breed: form.breed || undefined,
        known_allergies: selectedAllergies.length > 0 ? selectedAllergies.join(", ") : undefined,
        medical_conditions: form.medical_conditions || undefined,
      }),
    onSuccess: (res) => {
      router.push(`/pets/${res.data.id}`);
    },
    onError: (e: any) => {
      setError(e.message ?? "Bir hata oluştu.");
    },
  });

  const set = (key: string, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleAllergy = (value: string) => {
    setSelectedAllergies((prev) =>
      prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value]
    );
  };

  const handleSpeciesChange = (species: string) => {
    set("species", species);
    set("breed", ""); // ırk seçimini sıfırla
  };

  return (
    <AppLayout backHref="/dashboard" backLabel="Dashboard">
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 w-full max-w-lg">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Hayvan Ekle</h1>

        <div className="space-y-4">
          {/* Name */}
          <Field label="İsim *">
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputClass}
              placeholder="Karamel, Mişu..."
            />
          </Field>

          {/* Species */}
          <Field label="Tür *">
            <div className="flex gap-3">
              {SPECIES_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => handleSpeciesChange(s.value)}
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition ${
                    form.species === s.value
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-300 text-gray-600 hover:border-gray-400"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </Field>

          {/* Breed - dropdown */}
          <Field label="Irk">
            <select
              value={form.breed}
              onChange={(e) => set("breed", e.target.value)}
              className={inputClass}
            >
              <option value="">— Seçiniz —</option>
              {BREED_OPTIONS[form.species].map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
          </Field>

          {/* Sex */}
          <Field label="Cinsiyet *">
            <div className="flex gap-3">
              {[{ value: "male", label: "Erkek" }, { value: "female", label: "Dişi" }].map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => set("sex", s.value)}
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition ${
                    form.sex === s.value
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-300 text-gray-600"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </Field>

          {/* Birth date + Weight */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Doğum tarihi">
              <input
                type="date"
                value={form.birth_date}
                onChange={(e) => set("birth_date", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Ağırlık (kg) *">
              <input
                type="number"
                step="0.1"
                required
                value={form.weight_kg}
                onChange={(e) => set("weight_kg", e.target.value)}
                className={inputClass}
                placeholder="4.5"
              />
            </Field>
          </div>

          {/* Activity level */}
          <Field label="Aktivite seviyesi">
            <select
              value={form.activity_level}
              onChange={(e) => set("activity_level", e.target.value)}
              className={inputClass}
            >
              {ACTIVITY_OPTIONS.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </Field>

          {/* Neutered */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="neutered"
              checked={form.is_neutered}
              onChange={(e) => set("is_neutered", e.target.checked)}
              className="w-4 h-4 accent-indigo-600"
            />
            <label htmlFor="neutered" className="text-sm text-gray-700">
              Kısırlaştırıldı
            </label>
          </div>

          {/* Allergies - multi select */}
          <Field label="Bilinen alerjiler">
            <div className="flex flex-wrap gap-2 mt-1">
              {ALLERGY_OPTIONS.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => toggleAllergy(a.value)}
                  className={`px-3 py-1.5 rounded-full text-sm border font-medium transition ${
                    selectedAllergies.includes(a.value)
                      ? "bg-red-50 border-red-400 text-red-700"
                      : "bg-gray-50 border-gray-300 text-gray-600 hover:border-gray-400"
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
            {selectedAllergies.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                Seçilenler: {selectedAllergies.join(", ")}
              </p>
            )}
          </Field>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !form.name || !form.weight_kg}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {mutation.isPending ? "Kaydediliyor..." : "Hayvan Ekle"}
          </button>
        </div>
      </div>
    </div>
    </AppLayout>
  );
}

const inputClass =
  "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
