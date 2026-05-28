"use client";

import Link from "next/link";

interface Pet {
  id: string;
  name: string;
  species: "dog" | "cat";
  breed?: string;
  weight_kg: number;
  activity_level: string;
  avatar_url?: string;
}

export function PetCard({ pet }: { pet: Pet }) {
  const emoji = pet.species === "dog" ? "🐕" : "🐈";

  return (
    <Link href={`/pets/${pet.id}`}>
      <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition cursor-pointer flex items-center gap-4">
        <div className="text-4xl w-14 h-14 flex items-center justify-center bg-indigo-50 rounded-full">
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{pet.name}</h3>
          <p className="text-sm text-gray-500 truncate">{pet.breed ?? pet.species}</p>
          <p className="text-xs text-gray-400 mt-1">{pet.weight_kg} kg</p>
        </div>
        <div className="text-gray-300">→</div>
      </div>
    </Link>
  );
}
