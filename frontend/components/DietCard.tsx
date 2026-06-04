"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api";

interface DietCardProps {
  petId: string;
  petName: string;
}

const STATUS_CONFIG: Record<string, { bg: string; border: string; badge: string; icon: string; text: string }> = {
  severely_underweight: {
    bg: "from-red-50 to-rose-50", border: "border-red-200",
    badge: "bg-red-100 text-red-700", icon: "🔴", text: "text-red-700",
  },
  underweight: {
    bg: "from-orange-50 to-amber-50", border: "border-orange-200",
    badge: "bg-orange-100 text-orange-700", icon: "🟠", text: "text-orange-700",
  },
  normal: {
    bg: "from-green-50 to-emerald-50", border: "border-green-200",
    badge: "bg-green-100 text-green-700", icon: "🟢", text: "text-green-700",
  },
  overweight: {
    bg: "from-amber-50 to-orange-50", border: "border-amber-200",
    badge: "bg-amber-100 text-amber-700", icon: "🟡", text: "text-amber-700",
  },
  obese: {
    bg: "from-red-50 to-pink-50", border: "border-red-200",
    badge: "bg-red-100 text-red-700", icon: "🔴", text: "text-red-700",
  },
};

const PHASE_ICONS: Record<string, string> = {
  weight_loss: "📉",
  weight_gain: "📈",
  maintenance: "⚖️",
};

export function DietCard({ petId, petName }: DietCardProps) {
  const { data: diet, isLoading, error } = useQuery({
    queryKey: ["diet", petId],
    queryFn: () => analyticsApi.getDietAnalysis(petId).then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">🥗</div>
          <h2 className="font-bold text-gray-900">Diyet Analizi</h2>
        </div>
        <div className="flex items-center justify-center py-10">
          <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !diet) return null;

  const cfg = STATUS_CONFIG[diet.status] ?? STATUS_CONFIG.normal;
  const phaseIcon = PHASE_ICONS[diet.phase] ?? "⚖️";

  // BCS gauge: 1-9 scale, ideal is 4-5
  const bcsPercent = ((diet.bcs_score - 1) / 8) * 100;
  const bcsColor = diet.bcs_score <= 3 ? "bg-orange-400" : diet.bcs_score <= 5 ? "bg-green-400" : diet.bcs_score <= 7 ? "bg-amber-400" : "bg-red-500";

  // Weight progress bar
  const isOverweight = diet.weight_to_lose > 0;
  const maxDiff = Math.max(Math.abs(diet.weight_to_lose), diet.current_weight * 0.2);
  const progressPct = Math.min(100, (Math.abs(diet.weight_to_lose) / maxDiff) * 100);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className={`bg-gradient-to-r ${cfg.bg} border-b ${cfg.border} px-6 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{phaseIcon}</div>
            <div>
              <h2 className="font-bold text-gray-900">Diyet Analizi</h2>
              <p className="text-xs text-gray-500">{petName} icin kisilestirilmis plan</p>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${cfg.badge}`}>
            <span>{cfg.icon}</span>
            <span>{diet.status_label}</span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Summary */}
        <p className={`text-sm font-medium ${cfg.text} bg-white rounded-xl border ${cfg.border} px-4 py-3`}>
          {diet.summary}
        </p>

        {/* Weight vs Ideal */}
        <div className="grid grid-cols-3 gap-3">
          <WeightStat label="Mevcut Kilo" value={`${diet.current_weight} kg`} highlight />
          <WeightStat label="Ideal Kilo" value={`${diet.ideal_weight.toFixed(1)} kg`} sub={`${diet.ideal_weight_min.toFixed(1)}-${diet.ideal_weight_max.toFixed(1)} kg`} />
          <WeightStat
            label={diet.weight_to_lose > 0 ? "Verilecek" : "Alinacak"}
            value={`${Math.abs(diet.weight_to_lose).toFixed(1)} kg`}
            color={diet.weight_to_lose > 0 ? "text-red-500" : "text-orange-500"}
          />
        </div>

        {/* BCS Gauge */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vucut Kondisyon Skoru (BCS)</span>
            <span className="text-sm font-bold text-gray-900">{diet.bcs_score}/9</span>
          </div>
          <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
            {/* Ideal zone (BCS 4-5 = ~33-55%) */}
            <div className="absolute top-0 h-full bg-green-200/60 rounded-full" style={{ left: "33%", width: "22%" }} />
            {/* Current position */}
            <div
              className={`absolute top-0 h-full w-3 rounded-full ${bcsColor} shadow-sm transition-all`}
              style={{ left: `${Math.max(0, bcsPercent - 2)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>1 - Cok Zayif</span>
            <span className="text-green-600 font-medium">4-5 Ideal</span>
            <span>9 - Obez</span>
          </div>
          <p className="text-xs text-gray-500 mt-1.5 italic">"{diet.bcs_description}"</p>
        </div>

        {/* Calorie Targets */}
        <div className="bg-slate-900 rounded-2xl p-4 text-white">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Kalori Plani</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-400">Gunluk Idame</p>
              <p className="text-xl font-bold text-slate-200">{diet.daily_calories_maintenance} <span className="text-sm font-normal">kcal</span></p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Diyet Hedefi</p>
              <p className={`text-xl font-bold ${diet.calorie_adjustment < 0 ? "text-amber-400" : diet.calorie_adjustment > 0 ? "text-green-400" : "text-slate-200"}`}>
                {diet.daily_calories_target} <span className="text-sm font-normal">kcal</span>
              </p>
            </div>
          </div>

          {diet.calorie_adjustment !== 0 && (
            <div className={`mt-3 flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-xl ${
              diet.calorie_adjustment < 0 ? "bg-amber-400/20 text-amber-400" : "bg-green-400/20 text-green-400"
            }`}>
              <span>{diet.calorie_adjustment < 0 ? "▼" : "▲"}</span>
              <span>Gunluk {Math.abs(diet.calorie_adjustment)} kcal {diet.calorie_adjustment < 0 ? "azalt" : "artir"}</span>
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800">
            <span className="text-xs text-slate-400">Gunluk ogun sayisi</span>
            <span className="text-sm font-bold text-white">{diet.meal_frequency}x / gun</span>
          </div>
        </div>

        {/* Timeline */}
        {diet.weeks_to_goal > 0 && (
          <div className="flex items-center gap-4 bg-gray-50 rounded-2xl px-4 py-3">
            <div className="text-2xl">🎯</div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Tahmini Sure</p>
              <p className="text-xs text-gray-400">{diet.weekly_weight_change_target < 0 ? "Kilo verme" : "Kilo alma"} programi</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-amber-500">{diet.weeks_to_goal}</p>
              <p className="text-xs text-gray-400">hafta</p>
            </div>
          </div>
        )}

        {/* Trend */}
        {diet.trend && (
          <div className={`flex items-start gap-3 rounded-2xl px-4 py-3 border ${
            diet.trend.on_track
              ? "bg-green-50 border-green-100"
              : "bg-amber-50 border-amber-100"
          }`}>
            <span className="text-xl mt-0.5">{diet.trend.on_track ? "✅" : "⚠️"}</span>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {diet.trend.direction === "gaining" ? "Kilo Aliyor" :
                 diet.trend.direction === "losing" ? "Kilo Veriyor" : "Kilo Sabit"}
                {" "}(Haftada {Math.abs(diet.trend.rate_per_week).toFixed(2)} kg)
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{diet.trend.message}</p>
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Oneriler</h3>
          <ul className="space-y-2">
            {diet.recommendations.map((rec: string, i: number) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-gray-300 text-center">
          Her agirlik kaydinda diyet plani otomatik guncellenir
        </p>
      </div>
    </div>
  );
}

function WeightStat({ label, value, sub, highlight, color }: {
  label: string; value: string; sub?: string; highlight?: boolean; color?: string;
}) {
  return (
    <div className={`rounded-xl p-3 text-center ${highlight ? "bg-slate-900" : "bg-gray-50"}`}>
      <p className={`text-xs mb-1 ${highlight ? "text-slate-400" : "text-gray-400"}`}>{label}</p>
      <p className={`font-bold text-sm ${color ?? (highlight ? "text-white" : "text-gray-900")}`}>{value}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}
