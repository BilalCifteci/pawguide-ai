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
  Area,
  AreaChart,
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
    kg: log.weight_kg,
  }));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-bold text-gray-900">Agirlik Takibi</h2>
          <p className="text-xs text-gray-400 mt-0.5">Son 60 gun</p>
        </div>
        <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-base">
          📈
        </div>
      </div>

      {isLoading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-gray-300">
            <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Yukleniyor...</span>
          </div>
        </div>
      ) : chartData.length < 2 ? (
        <div className="h-48 flex flex-col items-center justify-center gap-2 text-center">
          <span className="text-3xl">📊</span>
          <p className="text-sm text-gray-500 font-medium">Henuz veri yok</p>
          <p className="text-xs text-gray-400">Agirlik kaydettikce grafik olusacak</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              tickFormatter={(v) => `${v}kg`}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{ borderRadius: "12px", border: "1px solid #f3f4f6", fontSize: 12, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
              formatter={(v) => [`${v} kg`, "Agirlik"]}
            />
            <Area
              type="monotone"
              dataKey="kg"
              stroke="#f59e0b"
              strokeWidth={2.5}
              fill="url(#weightGrad)"
              dot={false}
              activeDot={{ r: 5, fill: "#f59e0b", stroke: "white", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
