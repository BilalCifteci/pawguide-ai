"use client";

import { useQuery } from "@tanstack/react-query";
import { petsApi } from "@/lib/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";

export function WeightChart({ petId }: { petId: string }) {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["weight-logs", petId],
    queryFn: () => petsApi.getWeightLogs(petId, 60).then((r) => r.data),
  });

  const chartData = [...logs].reverse().map((log: any) => ({
    date: format(parseISO(log.logged_at), "d MMM", { locale: tr }),
    "Ağırlık (kg)": log.weight_kg,
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
        Ağırlık Takibi
      </h2>
      {isLoading ? (
        <div className="h-48 flex items-center justify-center text-gray-400">
          Yükleniyor...
        </div>
      ) : chartData.length < 2 ? (
        <div className="h-48 flex items-center justify-center text-gray-400">
          Grafik için en az 2 kayıt gereklidir.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => `${v} kg`}
            />
            <Tooltip formatter={(v) => [`${v} kg`, "Ağırlık"]} />
            <Line
              type="monotone"
              dataKey="Ağırlık (kg)"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
