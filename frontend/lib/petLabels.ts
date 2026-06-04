export const BREED_LABELS: Record<string, string> = {
  golden_retriever: "Golden Retriever",
  labrador: "Labrador",
  german_shepherd: "Alman Coban Kopegi",
  bulldog: "Bulldog",
  poodle: "Kanis",
  chihuahua: "Chihuahua",
  husky: "Husky",
  beagle: "Beagle",
  border_collie: "Border Collie",
  pomeranian: "Pomeranian",
  maltese: "Maltese",
  mixed: "Melez",
  other: "Diger",
  tekir: "Tekir",
  van: "Van Kedisi",
  angora: "Ankara Kedisi",
  persian: "Iran Kedisi",
  british_shorthair: "British Shorthair",
  scottish_fold: "Scottish Fold",
  maine_coon: "Maine Coon",
  siamese: "Siyam",
  ragdoll: "Ragdoll",
  bengal: "Bengal",
};

export const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: "Hareketsiz",
  low: "Az Aktif",
  moderate: "Orta",
  high: "Aktif",
  very_high: "Cok Aktif",
};

export const SEX_LABELS: Record<string, string> = {
  male: "Erkek",
  female: "Disi",
};

export const SPECIES_LABELS: Record<string, string> = {
  dog: "Kopek",
  cat: "Kedi",
};

export function getBreedLabel(breed?: string | null): string {
  if (!breed) return "";
  return BREED_LABELS[breed] ?? breed;
}

export function getActivityLabel(level?: string | null): string {
  if (!level) return "";
  return ACTIVITY_LABELS[level] ?? level;
}
