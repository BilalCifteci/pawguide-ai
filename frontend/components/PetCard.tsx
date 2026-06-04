"use client";

import Link from "next/link";
import { getBreedLabel, getActivityLabel } from "@/lib/petLabels";

interface Pet {
  id: string;
  name: string;
  species: "dog" | "cat";
  breed?: string;
  weight_kg: number;
  activity_level: string;
  avatar_url?: string;
  sex?: string;
}


const SPECIES_BG: Record<string, string> = {
  dog: "from-amber-100 to-orange-100",
  cat: "from-violet-100 to-purple-100",
};

export function PetCard({ pet }: { pet: Pet }) {
  const emoji = pet.species === "dog" ? "🐕" : "🐈";
  const bg = SPECIES_BG[pet.species] ?? "from-gray-100 to-gray-100";
  const activityLabel = getActivityLabel(pet.activity_level);
  const breedLabel = getBreedLabel(pet.breed) || (pet.species === "dog" ? "Kopek" : "Kedi");

  return (
    <Link href={`/pets/${pet.id}`}>
      <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-amber-200 transition-all cursor-pointer group">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${bg} flex items-center justify-center text-3xl shadow-sm group-hover:scale-105 transition-transform`}>
            {emoji}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 text-base truncate">{pet.name}</h3>
              {pet.sex && (
                <span className="text-xs text-gray-400">{pet.sex === "male" ? "♂" : "♀"}</span>
              )}
            </div>
            <p className="text-sm text-gray-500 truncate">{breedLabel}</p>
          </div>

          <svg className="w-4 h-4 text-gray-300 group-hover:text-amber-400 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>

        {/* Stats */}
        <div className="flex gap-3 mt-4 pt-4 border-t border-gray-50">
          <Stat label="Agirlik" value={`${pet.weight_kg} kg`} />
          <div className="w-px bg-gray-100" />
          <Stat label="Aktivite" value={activityLabel} />
          <div className="w-px bg-gray-100" />
          <Stat label="Tur" value={pet.species === "dog" ? "Kopek" : "Kedi"} />
        </div>
      </div>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 text-center">
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-xs font-semibold text-gray-700">{value}</p>
    </div>
  );
}
